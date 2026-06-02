import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

const SECTIONS = [
  { id: 'general', n: '1', title: 'כללי' },
  { id: 'eligibility', n: '2', title: 'תנאי השתתפות' },
  { id: 'draw', n: '3', title: 'מועד ואופן ההגרלה' },
  { id: 'prize', n: '4', title: 'הפרס' },
  { id: 'winner', n: '5', title: 'הודעה על זכייה' },
  { id: 'privacy', n: '6', title: 'פרטיות ודיוור' },
  { id: 'publicity', n: '7', title: 'פרסום הזוכה' },
  { id: 'liability', n: '8', title: 'אחריות' },
  { id: 'law', n: '9', title: 'דין וסמכות שיפוט' },
] as const;

function Clause({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 text-[0.95rem] leading-7" style={{ color: 'rgba(255,255,255,0.65)' }}>
      <span className="shrink-0 font-mono text-xs font-semibold text-spotnet-orangeLight pt-1">{n}</span>
      <p className="flex-1">{children}</p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mr-8 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[0.95rem] leading-7" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-spotnet-orange" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TermsSection({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 relative overflow-hidden group rounded-2xl p-6 md:p-8 backdrop-blur-sm transition-all duration-500"
      style={{
        background: 'rgba(0,0,0,0.40)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="pointer-events-none absolute -left-2 -top-4 text-7xl font-black select-none" style={{ color: 'rgba(249,124,29,0.05)' }}>{n}</span>
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(255,160,77,0.18), rgba(249,124,29,0.10))',
              border: '1px solid rgba(249,124,29,0.35)',
              boxShadow: '0 0 18px rgba(249,124,29,0.15)',
            }}
          >
            {n}
          </span>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
}

export default function Terms() {
  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        <div className="ambient-orange" style={{ top: '-200px', right: '-200px' }} />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(249,124,29,0.05) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative px-6 md:px-12 py-12 md:py-16 max-w-6xl mx-auto animate-fade-in">
          <header className="mb-12 md:mb-14">
            <span className="trust-badge mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-spotnet-orange animate-pulse" />
              Forti Security Day · 03.06.2026
            </span>
            <h1
              className="text-4xl md:text-6xl font-semibold max-w-3xl leading-[1.1]"
              style={{ letterSpacing: '-0.025em' }}
            >
              <span className="headline-gradient">תקנון השתתפות בהגרלת</span>{' '}
              <span className="headline-gradient">Starlink Standard Kit</span>
            </h1>
          </header>

          <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
            <nav className="lg:sticky lg:top-8 glass p-4 md:p-5 hidden lg:block">
              <div className="label mb-3">תוכן עניינים</div>
              <ol className="space-y-1">
                {SECTIONS.map(({ id, n, title }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition"
                      style={{ color: 'rgba(255,255,255,0.60)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(249,124,29,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.60)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="font-mono text-[10px] text-spotnet-orangeLight">{n}</span>
                      <span>{title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-5 min-w-0">
              <TermsSection id="general" n="1" title="כללי">
                <Clause n="1.1">תקנון זה מסדיר את תנאי ההשתתפות בהגרלה חד-פעמית שתיערך במסגרת כנס Forti Security Day ביום 03.06.2026 (להלן: &quot;ההגרלה&quot;).</Clause>
                <Clause n="1.2">ההשתתפות בהגרלה מהווה הסכמה מלאה לכל תנאי תקנון זה.</Clause>
                <Clause n="1.3">ספוטנט בע&quot;מ שומרת לעצמה את הזכות לשנות, לעדכן, לדחות או לבטל את ההגרלה בכל עת, בהתאם לשיקול דעתה ובהתאם להוראות הדין.</Clause>
              </TermsSection>

              <TermsSection id="eligibility" n="2" title="תנאי השתתפות">
                <Clause n="2.1">ההשתתפות בהגרלה פתוחה לכל משתתף אשר מילא את טופס ההרשמה במלואו.</Clause>
                <Clause n="2.2">לצורך ההשתתפות יידרש המשתתף למסור את הפרטים הבאים:</Clause>
                <BulletList items={['שם מלא', 'שם החברה', 'תפקיד', 'מספר טלפון', 'כתובת דואר אלקטרוני (E-mail)']} />
                <Clause n="2.3">בנוסף, המשתתף יתבקש לבחור תחום עניין מקצועי מתוך רשימת תחומים שתוצג בטופס ההרשמה.</Clause>
                <Clause n="2.4">כתנאי להשתתפות בהגרלה, על המשתתף לאשר קבלת עדכונים, דיוור מקצועי, תוכן שיווקי והודעות SMS מספוטנט בע&quot;מ ו/או מגורמים הפועלים מטעמה.</Clause>
                <Clause n="2.5">משתתף שמסר פרטים חלקיים, שגויים או שאינם ניתנים לאימות, רשאית החברה המגרילה לפסול את השתתפותו.</Clause>
              </TermsSection>

              <TermsSection id="draw" n="3" title="מועד ואופן ביצוע ההגרלה">
                <Clause n="3.1">ההגרלה תתקיים במהלך כנס Forti Security Day ביום 03.06.2026, בשעה שתיקבע על ידי החברה המגרילה.</Clause>
                <Clause n="3.2">מספר דקות לפני תחילת ההגרלה תישלח הודעה למשתתפים באמצעות SMS, דואר אלקטרוני או בכל אמצעי תקשורת אחר לפי שיקול דעת החברה.</Clause>
                <Clause n="3.3">ההגרלה תבוצע באופן אקראי מתוך כלל המשתתפים אשר עמדו בתנאי תקנון זה.</Clause>
                <Clause n="3.4">הליך ההגרלה יוקרן בשידור חי במהלך הכנס.</Clause>
                <Clause n="3.5">החלטת החברה המגרילה בנוגע לזהות הזוכה תהיה סופית ומוחלטת.</Clause>
              </TermsSection>

              <TermsSection id="prize" n="4" title="הפרס">
                <div
                  className="rounded-2xl px-5 py-4 mb-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,124,29,0.10), rgba(249,124,29,0.03))',
                    border: '1px solid rgba(249,124,29,0.30)',
                    boxShadow: '0 0 30px rgba(249,124,29,0.10)',
                  }}
                >
                  <div className="label mb-1 text-spotnet-orangeLight">הפרס</div>
                  <div className="text-lg font-semibold text-white">ערכת Starlink Standard Kit</div>
                  <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>חומרה בלבד · Hardware only</div>
                </div>
                <Clause n="4.1">במסגרת ההגרלה ייבחר זוכה אחד אשר יהיה זכאי לקבל את הפרס המפורט לעיל.</Clause>
                <Clause n="4.2">הפרס כולל את ציוד הקצה (Hardware) בלבד ואינו כולל:</Clause>
                <BulletList items={['חבילת שירות של Starlink', 'דמי מנוי חודשיים', 'התקנה', 'שירותי תמיכה', 'אביזרים נוספים שאינם כלולים בערכה המקורית']} />
                <Clause n="4.3">לצורך הפעלת המוצר נדרש הזוכה לרכוש בנפרד חבילת שירות מתאימה.</Clause>
                <Clause n="4.4">הזוכה רשאי לבחור בין אחת מהאפשרויות הבאות:</Clause>
                <BulletList items={['א. רכישת חבילת שירות באמצעות ספוטנט בע&quot;מ.', 'ב. רכישת חבילת שירות ישירות מיצרן השירות, בכפוף להודעה מראש לספוטנט בע&quot;מ לצורך הסדרת הבעלות והאפשרות לניהול השירות ישירות מול היצרן.']} />
                <Clause n="4.5">האחריות על רכישת חבילת השירות, הפעלת המוצר ותשלום כל העלויות הנלוות מוטלת באופן בלעדי על הזוכה.</Clause>
                <Clause n="4.6">הפרס אינו ניתן להמרה בכסף, בזיכוי או בכל טובת הנאה אחרת.</Clause>
              </TermsSection>

              <TermsSection id="winner" n="5" title="הודעה על זכייה">
                <Clause n="5.1">הזוכה יקבל הודעה על זכייתו באמצעות פרטי ההתקשרות שמסר בטופס ההרשמה.</Clause>
                <Clause n="5.2">לאחר ההגרלה תיצור החברה קשר עם הזוכה לצורך אימות פרטים ותיאום מסירת הפרס.</Clause>
                <Clause n="5.3">אם לא ניתן יהיה ליצור קשר עם הזוכה בתוך 30 ימים ממועד ההגרלה, או אם יתברר כי אינו עומד בתנאי התקנון, תהא החברה רשאית לבחור זוכה חלופי.</Clause>
              </TermsSection>

              <TermsSection id="privacy" n="6" title="פרטיות ודיוור">
                <Clause n="6.1">המשתתף מאשר כי הפרטים שנמסרו על ידו יישמרו במאגרי המידע של ספוטנט בע&quot;מ.</Clause>
                <Clause n="6.2">המידע ישמש לצורך:</Clause>
                <BulletList items={['ניהול ההגרלה', 'יצירת קשר עם המשתתפים', 'שליחת עדכונים מקצועיים', 'דיוור שיווקי', 'הזמנות לכנסים ואירועים', 'הצעות מסחריות', 'הודעות SMS ועדכונים שוטפים']} />
                <Clause n="6.3">המשתתף רשאי לבקש להסיר את פרטיו מרשימות הדיוור בכל עת בהתאם להוראות הדין.</Clause>
              </TermsSection>

              <TermsSection id="publicity" n="7" title="פרסום הזוכה">
                <Clause n="7.1">המשתתף מסכים כי במקרה של זכייה, תהיה ספוטנט רשאית לפרסם את:</Clause>
                <BulletList items={['שמו המלא', 'שם החברה בה הוא מועסק', 'תמונתו (ככל שתצולם במהלך הכנס)']} />
                <p className="text-[0.95rem] leading-7 mr-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  לצורך פרסום תוצאות ההגרלה, יחסי ציבור, שיווק ופרסום של פעילות החברה, ללא תמורה נוספת.
                </p>
              </TermsSection>

              <TermsSection id="liability" n="8" title="אחריות">
                <Clause n="8.1">ספוטנט לא תישא באחריות לכל תקלה טכנית, שיבוש, כשל תקשורתי או אירוע שאינו בשליטתה אשר עלול להשפיע על ההגרלה או על מסירת הפרס.</Clause>
                <Clause n="8.2">השימוש במוצר Starlink כפוף לתנאי השימוש, המדיניות וההגבלות של Starlink ו-SpaceX.</Clause>
                <Clause n="8.3">החברה המגרילה אינה אחראית לזמינות השירות, לכיסוי הגיאוגרפי, לתקלות תפעוליות או לשינויים בתנאי השירות של היצרן.</Clause>
              </TermsSection>

              <TermsSection id="law" n="9" title="דין וסמכות שיפוט">
                <Clause n="9.1">על תקנון זה יחולו דיני מדינת ישראל בלבד.</Clause>
                <Clause n="9.2">סמכות השיפוט הבלעדית בכל מחלוקת הנוגעת להגרלה תהיה נתונה לבתי המשפט המוסמכים במחוז מרכז.</Clause>
              </TermsSection>

              <div
                className="rounded-2xl p-6 md:p-8 backdrop-blur-sm"
                style={{
                  background: 'rgba(0,0,0,0.40)',
                  border: '1px solid rgba(249,124,29,0.25)',
                  boxShadow: '0 0 30px rgba(249,124,29,0.08)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,160,77,0.20), rgba(249,124,29,0.08))',
                      border: '1px solid rgba(249,124,29,0.40)',
                      boxShadow: '0 0 18px rgba(249,124,29,0.15)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-spotnet-orangeLight" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">אישור משתתף</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      אני מאשר/ת כי קראתי את התקנון, הבנתי את תנאיו ואני מסכים/ה להם במלואם.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span className="h-4 w-4 rounded" style={{ border: '1px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.03)' }} />
                        <span>מאשר/ת את תנאי התקנון</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span className="h-4 w-4 rounded" style={{ border: '1px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.03)' }} />
                        <span>מאשר/ת קבלת דיוור מקצועי, שיווקי והודעות SMS מספוטנט בע&quot;מ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/raffle" className="btn-primary px-10 py-3.5 text-base w-full sm:w-auto text-center">
              חזרה להרשמה
            </Link>
            <Link to="/raffle" className="btn-ghost px-8 py-3.5 w-full sm:w-auto text-center">
              דף הבית
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
