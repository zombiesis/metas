import { registerPlugin } from '@/lib/plugins';

registerPlugin({
  id: 'google-analytics',
  name: 'Google Analytics 4',
  description: 'Track visitors, page views, bounce rate, and conversions. See which pages students visit most.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '📊',
  category: 'analytics',
  recommended: true,
  setupGuide: '1. Go to analytics.google.com and sign in with college Google account\n2. Click Admin (gear icon) → Create Property\n3. Enter "Metas Adventist College" as property name\n4. Go to Data Streams → Add Stream → Web\n5. Enter your website URL\n6. Copy the Measurement ID (looks like G-XXXXXXXXXX)\n7. Paste it below and click Save',
  settings: [
    { key: 'measurementId', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
  ],
  headSnippet: `<script async src="https://www.googletagmanager.com/gtag/js?id={{measurementId}}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{{measurementId}}',{send_page_view:true});</script>`,
});

registerPlugin({
  id: 'facebook-pixel',
  name: 'Facebook & Instagram Ads',
  description: 'Track admissions from Facebook/Instagram ads. See which ads bring the most student inquiries.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '📘',
  category: 'analytics',
  setupGuide: '1. Go to business.facebook.com → Events Manager\n2. Click "Connect Data Sources" → Web → Facebook Pixel\n3. Name it "Metas College Website"\n4. Copy the Pixel ID (a long number)\n5. Paste below — ads will now track form submissions automatically',
  settings: [
    { key: 'pixelId', label: 'Facebook Pixel ID (number only)', type: 'text', placeholder: '123456789012345' },
  ],
  headSnippet: `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','{{pixelId}}');fbq('track','PageView');</script><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id={{pixelId}}&ev=PageView&noscript=1"/></noscript>`,
});

registerPlugin({
  id: 'google-tag-manager',
  name: 'Google Tag Manager',
  description: 'One container for all marketing tags. Let your marketing team add tags without developer help.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🏷️',
  category: 'analytics',
  setupGuide: '1. Go to tagmanager.google.com\n2. Create Account → name it "Metas College"\n3. Create Container → choose "Web"\n4. Copy the Container ID (starts with GTM-)\n5. Paste below — your marketing team can now add any tag from the GTM dashboard',
  settings: [
    { key: 'containerId', label: 'Container ID', type: 'text', placeholder: 'GTM-XXXXXXX' },
  ],
  headSnippet: `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{{containerId}}');</script>`,
  bodySnippet: `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{containerId}}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
});

registerPlugin({
  id: 'tawk-chat',
  name: 'Tawk.to Live Chat',
  description: 'Free live chat — answer student questions in real-time. Works on mobile too. No monthly fee.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '💬',
  category: 'communication',
  setupGuide: '1. Go to tawk.to and create a free account\n2. Add your website when prompted\n3. Go to Administration → Settings → Chat Widget\n4. Look at the widget code — find the URL like embed.tawk.to/XXXXX/YYYYY\n5. XXXXX is your Property ID, YYYYY is your Widget ID\n6. Paste both below',
  settings: [
    { key: 'propertyId', label: 'Property ID (from embed URL)', type: 'text', placeholder: '6xxxxxxxxxxxxxxxxxx' },
    { key: 'widgetId', label: 'Widget ID', type: 'text', placeholder: 'default', default: 'default' },
  ],
  bodySnippet: `<script>var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/{{propertyId}}/{{widgetId}}';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();</script>`,
});

registerPlugin({
  id: 'whatsapp-chat',
  name: 'WhatsApp Inquiry Button',
  description: 'Floating green button — students tap it and land directly in your WhatsApp chat. Best for mobile visitors.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🟢',
  category: 'communication',
  recommended: true,
  setupGuide: '1. Decide which phone number should receive messages\n2. Enter it below WITH country code but WITHOUT + sign\n3. Example: India number 95126 44385 → enter 919512644385\n4. The default message will pre-fill when students tap the button',
  settings: [
    { key: 'phone', label: 'WhatsApp Number (with country code, no +)', type: 'text', placeholder: '919512644385' },
    { key: 'message', label: 'Pre-filled Message', type: 'text', default: 'Hi, I would like to know about admissions at Metas Adventist College.' },
    { key: 'position', label: 'Button Position', type: 'select', options: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
  ],
  bodySnippet: `<a href="https://wa.me/{{phone}}?text={{message}}" target="_blank" rel="noopener" style="position:fixed;bottom:24px;{{position}}:24px;z-index:9999;background:#25d366;color:#fff;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 16px rgba(37,211,102,0.4);text-decoration:none;transition:transform 0.2s,box-shadow 0.2s" onmouseover="this.style.transform='scale(1.1)';this.style.boxShadow='0 6px 24px rgba(37,211,102,0.5)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 16px rgba(37,211,102,0.4)'" aria-label="Chat on WhatsApp"><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1112 20z"/></svg></a>`,
});

registerPlugin({
  id: 'crisp-chat',
  name: 'Crisp Live Chat',
  description: 'Modern chat with auto-replies and chatbot. Free plan supports 2 team members. Great for admissions team.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🔵',
  category: 'communication',
  setupGuide: '1. Sign up at crisp.chat (free plan available)\n2. Add your website\n3. Go to Settings → Website Settings → Setup Instructions\n4. Find your Website ID (a UUID like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)\n5. Paste it below',
  settings: [
    { key: 'websiteId', label: 'Crisp Website ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
  ],
  bodySnippet: `<script>window.$crisp=[];window.CRISP_WEBSITE_ID="{{websiteId}}";(function(){var d=document,s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();</script>`,
});

registerPlugin({
  id: 'calendly',
  name: 'Calendly Appointments',
  description: 'Let parents/students book campus visits or counseling sessions. Shows a booking button on your site.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '📅',
  category: 'integration',
  setupGuide: '1. Create account at calendly.com\n2. Set up an event type (e.g., "Campus Visit" or "Admission Counseling")\n3. Set your available times\n4. Copy your Calendly URL (e.g., https://calendly.com/metas-admissions)\n5. Paste below — a booking button will appear on your site',
  settings: [
    { key: 'url', label: 'Your Calendly Event URL', type: 'text', placeholder: 'https://calendly.com/your-name/30min' },
    { key: 'buttonText', label: 'Button Text', type: 'text', default: '📅 Book Campus Visit' },
    { key: 'color', label: 'Button Color', type: 'select', options: ['#006bff', '#b8860b', '#25d366', '#e91e63'], default: '#006bff' },
  ],
  headSnippet: `<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">`,
  bodySnippet: `<script src="https://assets.calendly.com/assets/external/widget.js" async></script><a href="#" onclick="Calendly.initPopupWidget({url:'{{url}}'});return false;" style="position:fixed;bottom:90px;right:24px;z-index:9998;background:{{color}};color:#fff;padding:12px 22px;border-radius:30px;font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:transform 0.2s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">{{buttonText}}</a>`,
});

registerPlugin({
  id: 'razorpay-donate',
  name: 'Razorpay Donations',
  description: 'Accept donations and fees via UPI, cards, and net banking. Razorpay is India\'s most trusted payment gateway.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '💰',
  category: 'integration',
  setupGuide: '1. Sign up at razorpay.com with college bank account\n2. Complete KYC verification\n3. Go to Dashboard → Payment Button → Create New\n4. Set amount (or allow custom amount)\n5. Copy the Button ID (starts with pl_)\n6. Paste below — a donate button will appear on your site',
  settings: [
    { key: 'buttonId', label: 'Payment Button ID', type: 'text', placeholder: 'pl_XXXXXXXXXXXXXX' },
  ],
  bodySnippet: `<div style="position:fixed;bottom:24px;left:24px;z-index:9998"><form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="{{buttonId}}" async></script></form></div>`,
});

registerPlugin({
  id: 'google-maps',
  name: 'Google Maps Location',
  description: 'Show your college on a map. Helps students find directions. Appears above the footer.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🗺️',
  category: 'integration',
  setupGuide: '1. Go to google.com/maps\n2. Search for "Metas Adventist College Surat"\n3. Click Share → Embed a map\n4. Copy the src URL from the iframe code (starts with https://www.google.com/maps/embed)\n5. Paste that URL below',
  settings: [
    { key: 'embedUrl', label: 'Google Maps Embed URL', type: 'text', placeholder: 'https://www.google.com/maps/embed?pb=...' },
    { key: 'height', label: 'Map Height (pixels)', type: 'text', default: '350' },
  ],
  bodySnippet: `<div id="gmap-section" style="width:100%;max-width:1200px;margin:40px auto;padding:0 24px"><iframe src="{{embedUrl}}" width="100%" height="{{height}}" style="border:0;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,0.08)" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="College Location"></iframe></div><script>var f=document.querySelector('footer');if(f)f.before(document.getElementById('gmap-section'))</script>`,
});

registerPlugin({
  id: 'instagram-feed',
  name: 'Instagram Feed',
  description: 'Display your latest Instagram posts on the website. Shows college life, events, and achievements.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '📸',
  category: 'integration',
  setupGuide: '1. Go to snapwidget.com and sign up free\n2. Connect your college Instagram account\n3. Choose a grid layout (3x1 or 4x1 recommended)\n4. Click "Get Widget" and copy the widget ID from the embed code\n5. Paste the ID below',
  settings: [
    { key: 'widgetId', label: 'SnapWidget ID (number)', type: 'text', placeholder: '123456' },
  ],
  bodySnippet: `<div id="ig-section" style="max-width:1200px;margin:40px auto;padding:0 24px"><h2 style="font-family:Georgia,serif;font-size:1.5rem;margin-bottom:16px;text-align:center">Follow Us on Instagram</h2><iframe src="https://snapwidget.com/embed/{{widgetId}}" allowtransparency="true" frameborder="0" scrolling="no" style="border:none;overflow:hidden;width:100%;height:320px;border-radius:12px"></iframe></div><script>var f=document.querySelector('footer');if(f)f.before(document.getElementById('ig-section'))</script>`,
});

registerPlugin({
  id: 'cookie-consent',
  name: 'Cookie Consent Banner',
  description: 'Legal compliance banner for cookies. Required if you use analytics or ads. Auto-hides after acceptance.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🍪',
  category: 'utility',
  recommended: true,
  setupGuide: 'No external account needed. Just customize the message and button text below. The banner will show once to each visitor and remember their choice.',
  settings: [
    { key: 'message', label: 'Banner Message', type: 'text', default: 'This website uses cookies to ensure you get the best experience.' },
    { key: 'buttonText', label: 'Accept Button Text', type: 'text', default: 'Got it!' },
    { key: 'policyUrl', label: 'Privacy Policy URL (optional)', type: 'text', placeholder: '/privacy-policy' },
  ],
  bodySnippet: `<script>if(!localStorage.getItem('cookie-consent')){var b=document.createElement('div');b.id='cookie-bar';b.innerHTML='<div style="position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:center;gap:16px;z-index:99999;font-size:14px;flex-wrap:wrap;box-shadow:0 -2px 10px rgba(0,0,0,0.1)"><span>🍪 {{message}}</span><button onclick="localStorage.setItem(\\'cookie-consent\\',\\'1\\');document.getElementById(\\'cookie-bar\\').remove()" style="background:#b8860b;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-weight:600;cursor:pointer;white-space:nowrap">{{buttonText}}</button></div>';document.body.appendChild(b)}</script>`,
});

registerPlugin({
  id: 'maintenance-mode',
  name: 'Maintenance Mode',
  description: 'Temporarily hide the site from visitors during updates. Admins stay logged in and can still access everything.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🚧',
  category: 'utility',
  setupGuide: 'Just enable this plugin when you need to take the site offline temporarily. Disable it when done. Logged-in admins will always see the normal site.',
  settings: [
    { key: 'title', label: 'Page Title', type: 'text', default: 'We\'ll be back soon!' },
    { key: 'message', label: 'Message for visitors', type: 'textarea', default: 'Metas Adventist College website is currently undergoing scheduled maintenance.\nWe apologize for the inconvenience. Please check back in a few hours.' },
    { key: 'showContact', label: 'Show contact number?', type: 'select', options: ['yes', 'no'], default: 'yes' },
  ],
  headSnippet: `<script>if(!document.cookie.includes('metas_admin_session')){document.title='{{title}}';document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;font-family:sans-serif;text-align:center;padding:40px;background:#f8f9fb"><div style="max-width:500px"><div style="font-size:4rem;margin-bottom:16px">🚧</div><h1 style="font-size:1.8rem;margin-bottom:12px;color:#1a1a2e">{{title}}</h1><p style="color:#666;line-height:1.7;white-space:pre-line">{{message}}</p>'+(('{{showContact}}'==='yes')?'<p style="margin-top:20px;color:#888">📞 Admission Enquiry: 95126 44385</p>':'')+'</div></div>';}</script>`,
});

registerPlugin({
  id: 'google-fonts',
  name: 'Google Fonts',
  description: 'Change the website font. Makes text look more modern or traditional depending on your choice.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '🔤',
  category: 'utility',
  setupGuide: '1. Browse fonts at fonts.google.com\n2. Find one you like (popular choices: Poppins, Nunito, Lato, Playfair Display)\n3. Type the exact font name below\n4. The font will load on all pages automatically',
  settings: [
    { key: 'fontFamily', label: 'Font Name (exact spelling from Google Fonts)', type: 'text', placeholder: 'Poppins' },
    { key: 'weights', label: 'Font Weights', type: 'text', default: '400;600;700' },
    { key: 'applyTo', label: 'Apply to', type: 'select', options: ['body', 'headings', 'both'], default: 'both' },
  ],
  headSnippet: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family={{fontFamily}}:wght@{{weights}}&display=swap" rel="stylesheet"><style>body{font-family:'{{fontFamily}}',sans-serif!important}h1,h2,h3,h4,h5,h6{font-family:'{{fontFamily}}',Georgia,serif!important}</style>`,
});

registerPlugin({
  id: 'youtube-welcome',
  name: 'Welcome Video Popup',
  description: 'Show a YouTube video to first-time visitors. Great for virtual campus tours or principal\'s welcome message.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '▶️',
  category: 'utility',
  setupGuide: '1. Upload your welcome video to YouTube\n2. Copy the video URL (e.g., https://youtube.com/watch?v=XXXXXXXXXXX)\n3. The Video ID is the part after "v=" (e.g., XXXXXXXXXXX)\n4. Paste just the ID below\n5. Video will show once per session (won\'t annoy returning visitors)',
  settings: [
    { key: 'videoId', label: 'YouTube Video ID (part after v=)', type: 'text', placeholder: 'dQw4w9WgXcQ' },
    { key: 'delay', label: 'Show after (seconds)', type: 'text', default: '3' },
  ],
  bodySnippet: `<div id="yt-welcome" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);align-items:center;justify-content:center;backdrop-filter:blur(4px)"><div style="position:relative;width:90%;max-width:720px;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4)"><iframe id="yt-frame" width="100%" style="aspect-ratio:16/9;display:block" src="" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe><button onclick="document.getElementById('yt-welcome').style.display='none';document.getElementById('yt-frame').src=''" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:1.5rem;width:40px;height:40px;border-radius:50%;cursor:pointer;display:grid;place-items:center">✕</button></div></div><script>if(!sessionStorage.getItem('yt-welcome-seen')){setTimeout(function(){document.getElementById('yt-welcome').style.display='flex';document.getElementById('yt-frame').src='https://www.youtube.com/embed/{{videoId}}?autoplay=1';sessionStorage.setItem('yt-welcome-seen','1')},{{delay}}*1000)}</script>`,
});

registerPlugin({
  id: 'custom-script',
  name: 'Custom Code',
  description: 'For advanced users: paste any HTML, CSS, or JavaScript code. Use this for services not listed above.',
  version: '2.0.0',
  author: 'Metas CMS',
  icon: '⚡',
  category: 'utility',
  setupGuide: 'Paste code provided by any third-party service. Common uses:\n• Chatbot widgets\n• Survey popups\n• Announcement bars\n• Custom CSS styling\n\n⚠️ Only paste code from trusted sources.',
  settings: [
    { key: 'headCode', label: 'Code for page <head> (loads first)', type: 'textarea', placeholder: '<script>...</script> or <link ...>' },
    { key: 'bodyCode', label: 'Code for page body (loads last)', type: 'textarea', placeholder: '<script>...</script> or <div>...</div>' },
  ],
  headSnippet: `{{headCode}}`,
  bodySnippet: `{{bodyCode}}`,
});


// --- Wikipedia & Google Knowledge Panel SEO ---
registerPlugin({
  id: 'knowledge-panel-seo',
  name: 'Google Knowledge Panel',
  description: 'Add structured data so Google shows your college in Knowledge Panels, Maps, and voice search. This is what powers the info box when someone Googles your college.',
  version: '1.0.0',
  author: 'Metas CMS',
  icon: '🏛️',
  category: 'seo',
  recommended: true,
  setupGuide: '1. Fill in your college details below\n2. Google will crawl this data automatically\n3. Within 2-4 weeks, your college info may appear in Google Knowledge Panel\n4. This also helps if you create a Wikipedia page — it validates your data\n5. No external account needed',
  settings: [
    { key: 'collegeName', label: 'Official College Name', type: 'text', default: 'Metas Adventist College' },
    { key: 'foundedYear', label: 'Year Founded', type: 'text', placeholder: '1947' },
    { key: 'address', label: 'Full Address', type: 'text', default: 'Athwalines, Surat, Gujarat 395001' },
    { key: 'phone', label: 'Phone Number', type: 'text', default: '0261-7160215' },
    { key: 'email', label: 'Official Email', type: 'text', default: 'principalcollege@metasofsda.in' },
    { key: 'website', label: 'Website URL', type: 'text', default: 'https://suratcollege.metasofsda.in' },
    { key: 'affiliation', label: 'Affiliated University', type: 'text', default: 'Veer Narmad South Gujarat University' },
    { key: 'programs', label: 'Programs Offered (comma separated)', type: 'text', default: 'BBA, MBA, GNM' },
    { key: 'logo', label: 'Logo URL', type: 'text', placeholder: 'https://yoursite.com/logo.png' },
    { key: 'description', label: 'Short Description (1-2 sentences)', type: 'textarea', default: 'Metas Adventist College is a values-based higher education institution in Surat, Gujarat, offering undergraduate and postgraduate programs in Management and Nursing.' },
  ],
  headSnippet: `<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollegeOrUniversity","name":"{{collegeName}}","description":"{{description}}","foundingDate":"{{foundedYear}}","address":{"@type":"PostalAddress","streetAddress":"{{address}}","addressLocality":"Surat","addressRegion":"Gujarat","postalCode":"395001","addressCountry":"IN"},"telephone":"{{phone}}","email":"{{email}}","url":"{{website}}","logo":"{{logo}}","parentOrganization":{"@type":"Organization","name":"Seventh-day Adventist Organization"},"affiliation":{"@type":"Organization","name":"{{affiliation}}"},"hasOfferCatalog":{"@type":"OfferCatalog","name":"Programs","itemListElement":[{{programs}}]}}</script>`,
});


// --- Open Graph Social Sharing ---
registerPlugin({
  id: 'open-graph',
  name: 'Social Media Preview',
  description: 'Control how your site looks when shared on WhatsApp, Facebook, Instagram, and Twitter. Shows your college image and description instead of a blank link.',
  version: '1.0.0',
  author: 'Metas CMS',
  icon: '🔗',
  category: 'seo',
  recommended: true,
  setupGuide: '1. Add your college details below\n2. When anyone shares your website link on WhatsApp/Facebook, it will show a rich preview with image, title, and description\n3. Upload a good banner image (1200x630px recommended)',
  settings: [
    { key: 'title', label: 'Site Title (shown in share preview)', type: 'text', default: 'Metas Adventist College, Surat' },
    { key: 'description', label: 'Description (shown below title)', type: 'text', default: 'Values-based higher education for academic excellence, professional growth, and leadership.' },
    { key: 'image', label: 'Share Image URL (1200x630px)', type: 'text', placeholder: 'https://yoursite.com/og-image.jpg' },
    { key: 'siteName', label: 'Site Name', type: 'text', default: 'Metas Adventist College' },
  ],
  headSnippet: `<meta property="og:type" content="website"><meta property="og:title" content="{{title}}"><meta property="og:description" content="{{description}}"><meta property="og:image" content="{{image}}"><meta property="og:site_name" content="{{siteName}}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{{title}}"><meta name="twitter:description" content="{{description}}"><meta name="twitter:image" content="{{image}}">`,
});

// --- Google Search Console Verification ---
registerPlugin({
  id: 'google-search-console',
  name: 'Google Search Console',
  description: 'Verify your site with Google Search Console to monitor search performance, fix indexing issues, and submit sitemaps.',
  version: '1.0.0',
  author: 'Metas CMS',
  icon: '🔍',
  category: 'seo',
  setupGuide: '1. Go to search.google.com/search-console\n2. Add your website URL\n3. Choose "HTML tag" verification method\n4. Copy the content value from the meta tag they give you\n5. Paste it below',
  settings: [
    { key: 'verificationCode', label: 'Verification Code (content value only)', type: 'text', placeholder: 'abc123xyz...' },
  ],
  headSnippet: `<meta name="google-site-verification" content="{{verificationCode}}">`,
});

// --- Bing Webmaster Verification ---
registerPlugin({
  id: 'bing-webmaster',
  name: 'Bing Webmaster',
  description: 'Verify with Bing to appear in Bing and Yahoo search results. Many parents use Bing on work computers.',
  version: '1.0.0',
  author: 'Metas CMS',
  icon: '🅱️',
  category: 'seo',
  setupGuide: '1. Go to bing.com/webmasters\n2. Add your site\n3. Choose "HTML Meta Tag" option\n4. Copy the content value\n5. Paste below',
  settings: [
    { key: 'verificationCode', label: 'Bing Verification Code', type: 'text', placeholder: 'XXXXXXXXXXXXXXXX' },
  ],
  headSnippet: `<meta name="msvalidate.01" content="{{verificationCode}}">`,
});

// --- Announcement Bar ---
registerPlugin({
  id: 'announcement-bar',
  name: 'Announcement Bar',
  description: 'Show a colored banner at the top of your site for admissions deadlines, exam dates, or important news. Visitors can dismiss it.',
  version: '1.0.0',
  author: 'Metas CMS',
  icon: '📣',
  category: 'utility',
  setupGuide: 'Just type your message and pick a color. The bar will show at the top of every page until the visitor closes it.',
  settings: [
    { key: 'message', label: 'Announcement Text', type: 'text', default: '📢 Admissions open for 2026-27! Apply now.' },
    { key: 'link', label: 'Link URL (optional)', type: 'text', placeholder: '/admissions' },
    { key: 'bgColor', label: 'Background Color', type: 'select', options: ['#0f172a', '#b8860b', '#dc2626', '#059669', '#1d4ed8'], default: '#b8860b' },
  ],
  bodySnippet: `<script>if(!sessionStorage.getItem('ann-closed')){var a=document.createElement('div');a.id='ann-bar';a.innerHTML='<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:{{bgColor}};color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:12px;font-size:14px;font-weight:500"><span>{{message}}</span>'+(('{{link}}')?'<a href="{{link}}" style="color:#fff;text-decoration:underline;font-weight:700">Learn more →</a>':'')+'<button onclick="sessionStorage.setItem(\\'ann-closed\\',\\'1\\');document.getElementById(\\'ann-bar\\').remove()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;margin-left:12px">✕</button></div>';document.body.prepend(a);document.body.style.paddingTop='44px'}</script>`,
});

// --- Auto SEO Meta Tags ---
registerPlugin({
  id: 'auto-seo-meta',
  name: 'Auto SEO Tags',
  description: 'Automatically adds essential SEO meta tags: charset, viewport, robots, canonical URL. Fixes common SEO issues without any configuration.',
  version: '1.0.0',
  author: 'Metas CMS',
  icon: '🏷️',
  category: 'seo',
  setupGuide: 'No configuration needed. Just install and it adds the essential meta tags that every site needs for proper SEO.',
  settings: [
    { key: 'siteUrl', label: 'Your Site URL (for canonical)', type: 'text', default: 'https://suratcollege.metasofsda.in' },
  ],
  headSnippet: `<meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="{{siteUrl}}"><meta name="theme-color" content="#0f172a">`,
});
