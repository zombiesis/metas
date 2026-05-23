import { Breadcrumbs } from '@/components/Breadcrumbs';

// FIX #11
export const metadata = {
  title: 'Alumni Network',
  description: 'Register with the Metas Adventist College alumni network — directory, mentorship, success stories and events.',
  alternates: { canonical: '/alumni' },
};

export default function Alumni() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Alumni', href: '/alumni' }]} />
      <section className="pagehero">
        <div className="wrap">
          <p className="eyebrow">Alumni</p>
          <h1>Alumni Network</h1>
          <p>Directory, registration, mentorship, success stories, events, and contribution pathways.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <form className="form" action="/api/forms/alumni" method="post">
            <h2>Alumni Registration</h2>
            <div className="formgrid">
              <label>Name<input name="name" required /></label>
              <label>Graduation year<input name="graduationYear" /></label>
              <label>Program<input name="program" /></label>
              <label>Profession<input name="profession" /></label>
              <label>Company<input name="company" /></label>
              <label>Email<input type="email" name="email" /></label>
              <label>Phone<input name="phone" /></label>
              <label>LinkedIn<input name="linkedin" /></label>
            </div>
            <label>Message<textarea name="message" /></label>
            <label className="consent"><input type="checkbox" name="consent" required /> I consent to alumni communication.</label>
            <button className="btn gold">Register</button>
          </form>
        </div>
      </section>
    </>
  );
}
