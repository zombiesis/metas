const redirectPairs = [['/index.php','/'],['/contact.php','/contact'],['/affiliations-and-accreditation','/iqac-accreditation'],['/iqac-reports','/iqac-accreditation'],['/course/BBA','/academics/bba'],['/course/MBA','/academics/mba'],['/course/GNM','/academics/gnm'],['/faculties/Teaching','/faculty'],['/student-wise-placement-information','/placements'],['/application-for-ug-pg/1/','/admissions/apply'],['/infrastructure/auditoruim','/infrastructure/auditorium'],['/current-openning','/careers/current-openings']];
/** @type {import('next').NextConfig} */
const nextConfig={trailingSlash:false,images:{formats:['image/avif','image/webp']},async redirects(){return redirectPairs.map(([source,destination])=>({source,destination,permanent:true}));}};
export default nextConfig;
