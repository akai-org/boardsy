type Logo = {
    logo: string;
    title: string;
    full: string;
}

export const logos: Record<string, Logo> = {
    black: {
        logo: '/logos/black/logo.png',
        title: '/logos/black/title.png',
        full: '/logos/black/full.png',
    },
    white: {
        logo: '/logos/white/logo.png',
        title: '/logos/white/title.png',
        full: '/logos/white/full.png',
    },
    violet: {
        logo: '/logos/violet/logo.png',
        title: '/logos/violet/title.png',
        full: '/logos/violet/full.png',
    },
    green: {
        logo: '/logos/green/logo.png',
        title: '/logos/green/title.png',
        full: '/logos/green/full.png',
    },
}