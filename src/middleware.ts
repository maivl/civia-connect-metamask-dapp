import { NextResponse, NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';
export const runtime = 'experimental-edge';
 
export const config = {
  runtime: 'edge',
  matcher: '/api/:path*'
};
 
export default async function getSessionToken(
  request: NextRequest,
  context: NextFetchEvent,
) {
    const url = new URL(request.url);
    
    if(url.pathname.startsWith('/api/getSessionToken')){
        const res = await fetch('http://101.132.135.175:5000/getSessionToken', {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
                ...request.headers
            },
            body: request.body || "{}"
        });
        return res;
    } else if (url.pathname.startsWith('/api/app/mockBind')) {
        console.log(request.body);
        const res = await fetch('http://101.132.135.175:5000/app/mockBind', {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
                ...request.headers
            },
            body: request.body || "{}"
        });
        return res;
    }
}