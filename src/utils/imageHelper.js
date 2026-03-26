export const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-product.png';
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.substring(0, baseUrl.length - 4);
    }
    
    // Normalize path: replace backslashes (Windows) with forward slashes, 
    // and remove leading slash
    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\//, '');
    
    if (normalizedPath.startsWith('uploads')) {
        return `${baseUrl}/${normalizedPath}`;
    }
    
    // If it's just a filename or other relative path that might be in uploads
    return `${baseUrl}/uploads/${normalizedPath}`;
};
