-- Update theme thumbnail URLs to use working Unsplash images
-- This fixes the broken image issue in the admin themes dashboard

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1470229722913-7ea9959fa270?w=800&h=600&fit=crop&auto=format'
WHERE name = 'Modern Dark';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&h=600&fit=crop&auto=format'
WHERE name = 'Vibrant Festival';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&auto=format'
WHERE name = 'Professional Corporate';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&h=600&fit=crop&auto=format'
WHERE name = 'Festiva' OR name LIKE '%Festival%';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop&auto=format'
WHERE name = 'Arena Pro' OR name LIKE '%Sports%';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop&auto=format'
WHERE name = 'DevConnect' OR name LIKE '%Tech%' OR name LIKE '%Developer%';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop&auto=format'
WHERE name LIKE '%Job%' OR name LIKE '%Career%';

UPDATE themes 
SET "thumbnailUrl" = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&auto=format'
WHERE name LIKE '%Expo%' OR name LIKE '%Visionary%';

-- Verify the updates
SELECT id, name, "thumbnailUrl" FROM themes ORDER BY name;
