const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

// Initialize ImageKit only if environment variables are available
let imagekit = null;
let isImageKitAvailable = false;

try {
    if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URI_ENDPOINT) {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URI_ENDPOINT
        });
        isImageKitAvailable = true;
        console.log('✅ ImageKit initialized successfully');
    } else {
        console.warn('⚠️ ImageKit configuration missing. File uploads will be saved locally.');
        console.warn('⚠️ To enable ImageKit, set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URI_ENDPOINT environment variables');
    }
} catch (error) {
    console.error('❌ Failed to initialize ImageKit:', error.message);
    console.warn('⚠️ File uploads will be saved locally as fallback');
}

async function uploadFile(file, fileName) {
    if (isImageKitAvailable && imagekit) {
        try {
            const result = await imagekit.upload({
                file: file,
                fileName: fileName,
            });
            return result;
        } catch (error) {
            console.error('❌ ImageKit upload failed, falling back to local storage:', error.message);
            return await saveFileLocally(file, fileName);
        }
    } else {
        return await saveFileLocally(file, fileName);
    }
}

async function saveFileLocally(file, fileName) {
    try {
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Create subdirectory based on file type
        const fileExtension = path.extname(fileName).toLowerCase();
        let subDir = 'files';
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
            subDir = 'images';
        } else if (['.mp4', '.avi', '.mov', '.wmv', '.webm'].includes(fileExtension)) {
            subDir = 'videos';
        }

        const subDirPath = path.join(uploadsDir, subDir);
        if (!fs.existsSync(subDirPath)) {
            fs.mkdirSync(subDirPath, { recursive: true });
        }

        const filePath = path.join(subDirPath, fileName);
        fs.writeFileSync(filePath, file);

        // Return a result object similar to ImageKit's response
        return {
            fileId: fileName,
            name: fileName,
            url: `/uploads/${subDir}/${fileName}`,
            filePath: filePath,
            size: file.length,
            fileType: fileExtension,
            isLocal: true
        };
    } catch (error) {
        console.error('❌ Failed to save file locally:', error.message);
        throw new Error('File upload failed');
    }
}

module.exports = {
    uploadFile
}