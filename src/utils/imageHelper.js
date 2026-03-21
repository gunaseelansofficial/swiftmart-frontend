export const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-product.png'; // Fallback to a placeholder in public folder
    
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    if (imagePath.startsWith('uploads')) {
        return `http://localhost:5000/${imagePath}`;
    }
    
    return imagePath;
};
