-- Add passkey database functions

-- Function to add passkey credential
CREATE OR REPLACE FUNCTION add_passkey_credential(
    p_user_id UUID,
    p_credential JSONB
)
RETURNS JSONB AS $$
DECLARE
    current_credentials JSONB;
    updated_credentials JSONB;
    result JSONB;
BEGIN
    -- Get current credentials
    SELECT passkey_credentials INTO current_credentials
    FROM users 
    WHERE id = p_user_id;
    
    -- Initialize if null
    IF current_credentials IS NULL THEN
        current_credentials := '[]'::jsonb;
    END IF;
    
    -- Add new credential to array
    updated_credentials := current_credentials || p_credential;
    
    -- Update user with new credentials
    UPDATE users 
    SET 
        passkey_credentials = updated_credentials,
        passkey_enabled = true,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'credential_count', jsonb_array_length(updated_credentials));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle passkey
CREATE OR REPLACE FUNCTION toggle_passkey(
    p_user_id UUID,
    p_enabled BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    current_credentials JSONB;
BEGIN
    -- Get current credentials
    SELECT passkey_credentials INTO current_credentials
    FROM users 
    WHERE id = p_user_id;
    
    -- If disabling and user has credentials, ask for confirmation
    IF NOT p_enabled AND current_credentials IS NOT NULL AND jsonb_array_length(current_credentials) > 0 THEN
        -- Just disable, don't remove credentials
        UPDATE users 
        SET 
            passkey_enabled = false,
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSIF p_enabled THEN
        -- Enable only if user has credentials
        IF current_credentials IS NULL OR jsonb_array_length(current_credentials) = 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'No passkey credentials found. Please register a passkey first.');
        END IF;
        
        UPDATE users 
        SET 
            passkey_enabled = true,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'enabled', p_enabled);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_passkey_credential(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_passkey(UUID, BOOLEAN) TO authenticated; 