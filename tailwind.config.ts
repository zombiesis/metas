import type { Config } from 'tailwindcss';
const config: Config = {content:['./src/**/*.{ts,tsx}'],theme:{extend:{colors:{navy:'#071B33',ivory:'#FBF7EF',gold:'#C7A45B',maroon:'#7A1E2C'},fontFamily:{serif:['Georgia','serif'],sans:['Inter','system-ui','sans-serif']}}},plugins:[]};
export default config;
