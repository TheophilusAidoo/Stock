-- Update existing notifications to change "Admin has sent" to "Support has sent"
UPDATE notifications
SET message = REPLACE(message, 'Admin has sent a new message on your support ticket:', 'Support has sent a new message on your support ticket:')
WHERE message LIKE '%Admin has sent a new message on your support ticket%';

-- Also update any variations
UPDATE notifications
SET message = REPLACE(message, 'admin has sent a new message on your support ticket:', 'Support has sent a new message on your support ticket:')
WHERE message LIKE '%admin has sent a new message on your support ticket%';










