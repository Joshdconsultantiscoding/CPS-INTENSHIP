import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error("Missing Cloudinary keys");
            return NextResponse.json({ error: 'Cloudinary not configured on server' }, { status: 500 });
        }

        // 1. Prepare timestamp
        const timestamp = Math.round(new Date().getTime() / 1000);

        // 2. Generate Signature
        // Signature = sha1(sorted_params + api_secret)
        // We are only passing 'timestamp' as a signed param here.
        const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

        // 3. Prepare FormData for Cloudinary
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('api_key', apiKey);
        uploadFormData.append('timestamp', timestamp.toString());
        uploadFormData.append('signature', signature);

        // 4. Determine Endpoint
        // Use 'auto' to let Cloudinary decide (image vs video vs raw)
        const resourceType = 'auto';

        // 5. Send to Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
            method: 'POST',
            body: uploadFormData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Cloudinary error:", data);
            throw new Error(data.error?.message || 'Upload failed');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
