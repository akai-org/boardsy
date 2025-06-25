import { getSession } from "@/server/auth";
import { getUser } from "@/server/dal";
import { NextRequest,  NextResponse } from "next/server";

interface Stroke {
    id: number
    type: 'stroke',
    points: { x: number; y: number }[]
    color: string
    width: number
}
//need to get current boardid
//and think of a way to store the arrays of points


export async function POST(req: NextRequest) {

    const form = await req.formData()
    const strokeObject = form.get("stroke")

    if (!strokeObject || typeof strokeObject !== 'string')

        return NextResponse.json(
            { error: " Nie ma stroku " },
            { status: 400 }
        )

    const stroke: Stroke = JSON.parse(strokeObject)

    return NextResponse.json(
                {
                        success: true    
                }
        )

}