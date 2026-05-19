import { ContactCards, DetailList, RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Contact() {
  const [site, pages] = await Promise.all([
    readCMSCollection<SiteSettings & { principal?: any }>('site'),
    readCMSCollection<Record<string, any>>('pages')
  ]);
  const page = pages.contact || {};
  const principal = site.principal || {};
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">Contact</p><h1>{page.title || 'Reach Metas Adventist College'}</h1><p>{site.address}</p></div></section>
      <section className="section">
        <div className="wrap twocol">
          <div>
            <ContactCards site={site} />
            <article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article>
            <article className="card"><h2>Principal / IQAC document contact</h2><DetailList items={[["Principal", principal.name], ["Designation", principal.designation], ["Registered email", principal.email], ["Alternate email", principal.alternateEmail], ["Office phone", principal.phone], ["Verification", principal.verificationStatus]]} /></article>
          </div>
          <form className="form" action="/api/forms/contact" method="post">
            <h2>Contact Form</h2>
            <div className="formgrid">
              <label>Name<input name="name" required /></label>
              <label>Phone<input name="phone" required /></label>
              <label>Email<input type="email" name="email" /></label>
              <label>Inquiry type<select name="inquiryType"><option>Admission</option><option>Placement</option><option>Faculty</option><option>Student</option><option>Alumni</option><option>Career</option><option>General</option></select></label>
            </div>
            <label>Message<textarea name="message" required /></label>
            <label className="consent"><input type="checkbox" name="consent" required /> I consent to being contacted.</label>
            <button className="btn gold">Submit</button>
          </form>
        </div>
      </section>
    </>
  );
}
