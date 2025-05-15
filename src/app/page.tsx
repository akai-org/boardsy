import Link from "next/link";

export default function Landing(){
 
    return(
        <>
            <h1>Landing page</h1>
            <div className="flex flex-col w-2/12 h-[100] items-center justify-evenly">
                <Link href={'signin'} className="bg-white text-black rounded p-[5]">Sign in</Link>
                <Link href={'signup'} className="bg-white text-black rounded p-[5]">Sign up</Link>
            </div>
        </>
    )
}