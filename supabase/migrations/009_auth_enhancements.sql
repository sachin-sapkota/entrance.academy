-- Authentication Enhancements Migration
-- This migration adds support for OAuth providers (Google, Apple) and passkey authentication

-- Add authentication provider fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;

-- Add passkey/biometric authentication fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS passkey_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS passkey_credentials JSONB DEFAULT '[]'::jsonb;

-- Add phone verification fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verification_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verification_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verification_attempts INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_locked_until TIMESTAMP WITH TIME ZONE;

-- Create index for OAuth IDs
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON public.users(apple_id) WHERE apple_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON public.users(auth_provider);

-- Create function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
DECLARE
    otp TEXT;
BEGIN
    -- Generate a 6-digit OTP
    otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN otp;
END;
$$ LANGUAGE plpgsql;

-- Create function to send phone verification OTP
CREATE OR REPLACE FUNCTION send_phone_verification(
    p_user_id UUID,
    p_phone TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_otp TEXT;
    v_user RECORD;
    v_result JSONB;
BEGIN
    -- Check if user exists
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Check if phone is already verified
    IF v_user.phone_verified = true THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Phone already verified'
        );
    END IF;
    
    -- Check if user is locked due to too many attempts
    IF v_user.phone_locked_until IS NOT NULL AND v_user.phone_locked_until > NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Too many attempts. Please try again later.'
        );
    END IF;
    
    -- Generate OTP
    v_otp := generate_otp();
    
    -- Update user with OTP and expiry
    UPDATE public.users
    SET 
        phone = COALESCE(p_phone, phone),
        phone_verification_code = v_otp,
        phone_verification_expires = NOW() + INTERVAL '10 minutes',
        phone_verification_attempts = 0,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- In production, you would send SMS here
    -- For now, we'll return the OTP in development mode
    v_result := jsonb_build_object(
        'success', true,
        'message', 'OTP sent successfully'
    );
    
    -- Only include OTP in development
    IF current_setting('app.environment', true) = 'development' THEN
        v_result := v_result || jsonb_build_object('otp', v_otp);
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify phone OTP
CREATE OR REPLACE FUNCTION verify_phone_otp(
    p_user_id UUID,
    p_otp TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_max_attempts INTEGER := 5;
BEGIN
    -- Get user
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Check if already verified
    IF v_user.phone_verified = true THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Phone already verified'
        );
    END IF;
    
    -- Check if locked
    IF v_user.phone_locked_until IS NOT NULL AND v_user.phone_locked_until > NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Too many attempts. Please try again later.'
        );
    END IF;
    
    -- Check if OTP exists and not expired
    IF v_user.phone_verification_code IS NULL OR v_user.phone_verification_expires < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'OTP expired or not found'
        );
    END IF;
    
    -- Verify OTP
    IF v_user.phone_verification_code = p_otp THEN
        -- Success - update user
        UPDATE public.users
        SET 
            phone_verified = true,
            phone_verification_code = NULL,
            phone_verification_expires = NULL,
            phone_verification_attempts = 0,
            phone_locked_until = NULL,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Phone verified successfully'
        );
    ELSE
        -- Failed attempt
        UPDATE public.users
        SET 
            phone_verification_attempts = phone_verification_attempts + 1,
            phone_locked_until = CASE 
                WHEN phone_verification_attempts + 1 >= v_max_attempts 
                THEN NOW() + INTERVAL '30 minutes'
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid OTP',
            'attempts_remaining', GREATEST(0, v_max_attempts - (v_user.phone_verification_attempts + 1))
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add passkey credential
CREATE OR REPLACE FUNCTION add_passkey_credential(
    p_user_id UUID,
    p_credential JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_credentials JSONB;
BEGIN
    -- Get user
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Get existing credentials
    v_credentials := COALESCE(v_user.passkey_credentials, '[]'::jsonb);
    
    -- Add new credential
    v_credentials := v_credentials || jsonb_build_array(p_credential);
    
    -- Update user
    UPDATE public.users
    SET 
        passkey_credentials = v_credentials,
        passkey_enabled = true,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Passkey added successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to toggle passkey
CREATE OR REPLACE FUNCTION toggle_passkey(
    p_user_id UUID,
    p_enabled BOOLEAN
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.users
    SET 
        passkey_enabled = p_enabled,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN p_enabled THEN 'Passkey enabled' ELSE 'Passkey disabled' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for phone verification functions
CREATE POLICY "Users can send OTP to their own phone" 
    ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_phone_verification(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_phone_otp(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_passkey_credential(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_passkey(UUID, BOOLEAN) TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN public.users.auth_provider IS 'Authentication provider used: email, google, apple, passkey';
COMMENT ON COLUMN public.users.passkey_enabled IS 'Whether passkey/biometric authentication is enabled';
COMMENT ON COLUMN public.users.passkey_credentials IS 'Array of WebAuthn credentials for passkey authentication'; 