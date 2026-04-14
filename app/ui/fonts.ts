import localFont from 'next/font/local';

export const generalsans = localFont({
    src: [
        {
            path: '../../public/fonts/GeneralSans-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../public/fonts/GeneralSans-Medium.woff2',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../../public/fonts/GeneralSans-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
    ],
    display: 'swap',
    variable: '--font-generalsans',
});