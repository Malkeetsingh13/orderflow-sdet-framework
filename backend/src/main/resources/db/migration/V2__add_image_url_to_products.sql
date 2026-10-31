-- Add the image_url column to the products table if it doesn't already exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);

-- Update seed data with professional product image URLs matching your inventory
UPDATE products 
SET image_url = 'https://m.media-amazon.com/images/I/61l9pp10qQL._AC_UY327_FMwebp_QL65_.jpg' 
WHERE name LIKE '%Keyboard%';

UPDATE products 
SET image_url = 'https://m.media-amazon.com/images/I/617qB001xSL._AC_UY327_FMwebp_QL65_.jpg' 
WHERE name LIKE '%Mouse%';