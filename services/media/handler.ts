import dotenv from "dotenv";
import {
    S3Client,
    GetObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import path from "path";
import {
    APIGatewayProxyEvent,
    Context,
    Callback,
    APIGatewayProxyResult,
} from "aws-lambda";
import { streamToBuffer } from "./helpers";
import { Readable } from "stream";
import sharp from "sharp";
import heicConvert from "heic-convert";

const envPath = path.resolve(__dirname, "../../../../.env");

dotenv.config({ path: envPath });

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
        "AWS credentials are not defined in the environment variables."
    );
}

const s3 = new S3Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const test = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: "OK" }),
    };
};

export const getPhoto = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    const filename = event.pathParameters!.filename;

    if (!filename) {
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({ error: "Filename is required" }),
        });
        return;
    }

    console.log("Fetching image for filename:", filename);

    try {
        const params = {
            Bucket: "mecha-photo-gallery",
            Key: filename,
        };

        const command = new GetObjectCommand(params);

        const data = await s3.send(command);

        if (!data.Body) {
            console.error("No data received from S3.");
            callback(null, {
                statusCode: 404,
                body: JSON.stringify({ error: "Image not found" }),
            });
            return;
        }

        const stream = data.Body;

        if (filename.toLowerCase().endsWith(".heic")) {
            const readableStream = Readable.from(stream as any); // Convert to Readable stream
            const buffer = await streamToBuffer(readableStream); // Convert stream to buffer
            const outputBuffer = await heicConvert({
                buffer: buffer, // the HEIC file buffer
                format: "JPEG", // output format
                quality: 0.8, // quality from 0 to 1
            });

            callback(null, {
                statusCode: 200,
                headers: {
                    "Content-Type": "image/jpeg",
                },                    
                body: Buffer.from(outputBuffer).toString("base64"),
                isBase64Encoded: true,
            });
            return;
        } else {
            const transformer = sharp()
                .resize(1000)
                .jpeg({ quality: 80 });

            const transformedStream = Readable.from(stream as any).pipe(transformer);
            const outputBuffer = await streamToBuffer(transformedStream);
        
            callback(null, {
                statusCode: 200,
                headers: {
                    "Content-Type": data.ContentType || "image/jpeg",
                },
                body: outputBuffer.toString("base64"),
                isBase64Encoded: true,
            });
        }
    } catch (error) {
        console.error("Error fetching image:", error);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch image" }),
        });
    }
};

export const getGallery = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    try {
        const params = {
            Bucket: "mecha-photo-gallery",
            Prefix: ``,
        };

        const command = new ListObjectsV2Command(params);

        const data = await s3.send(command);

        if (!data.Contents) {
            console.error("No files found in the S3 bucket.");
            callback(null, {
                statusCode: 404,
                body: JSON.stringify({ error: "No images found" }),
            });
            return;
        }

        const urls = data.Contents.map((file) => {
            return {
                url: `${file.Key}`,
            };
        });
        
        callback(null, {
            statusCode: 200,
            body: JSON.stringify(urls),
        });
        return;
    } catch (error) {
        console.error("Error fetching images:", error);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch images" }),
        });
    }
};