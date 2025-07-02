import { error } from "console";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";
import { buffer } from "stream/consumers";


interface ImageObject {
        id: number,
        type: 'image',
        image: File

}
interface ImageObjectResponse {
        id: number,
        type: 'image',
        url: string
}

export default async function POST(req: NextRequest) {

        const form = await req.formData()
        const imageObject = form.get("imageobject") as ImageObject | null

        if (!imageObject || !imageObject.image)
                return NextResponse.json(
                        { error: " Nie ma pliku " },
                        { status: 400 }
                )

        const original = Buffer.from(await imageObject.image.arrayBuffer())
        const webp = await sharp(original).webp({ quality: 80 }).toBuffer()
        const uploadDir = path.join(process.cwd(), "../../../public/uploads")
        const filename = `${uuid()}.webp`

        await writeFile(path.join(uploadDir, filename), webp)

        const response: ImageObjectResponse = {
                id: imageObject.id,
                type: 'image',
                url: `/uploads/${filename}`
        }

        return NextResponse.json(
                {
                        success: true,
                        imageObject: response
                }

        )
}
