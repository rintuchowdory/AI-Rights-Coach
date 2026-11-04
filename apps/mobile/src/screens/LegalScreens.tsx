import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Section = { heading: string; body: string[] };

// Angaben bewusst als Konstanten, damit sie an einer Stelle geaendert werden koennen.
const OPERATOR = {
  name: "Rintu Chowdory",
  street: "[Straße und Hausnummer]",
  city: "52499 Baesweiler",
  country: "Deutschland",
  email: "chowdoryrintu60@gmail.com",
  phone: "+49 176 82029425",
};

function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.intro}>{intro}</Text>
      {sections.map((section) => (
        <View key={section.heading} style={styles.card}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.body.map((paragraph, index) => (
            <Text key={index} style={styles.body}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
      <Text style={styles.footer}>
        Stand: 4. November 2026. Diese Seite beschreibt den aktuellen technischen Stand der App.
      </Text>
    </ScrollView>
  );
}

export function ImpressumScreen() {
  return (
    <LegalPage
      title="Impressum"
      intro="Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)."
      sections={[
        {
          heading: "Anbieter",
          body: [
            `${OPERATOR.name}\n${OPERATOR.street}\n${OPERATOR.city}\n${OPERATOR.country}`,
            "Hinweis: Die Straße und Hausnummer fehlen noch. Für ein vollständiges Impressum müssen sie hier und in der App eingetragen werden.",
          ],
        },
        {
          heading: "Kontakt",
          body: [
            `E-Mail: ${OPERATOR.email}`,
            `Telefon: ${OPERATOR.phone}`,
          ],
        },
        {
          heading: "Verantwortlich für den Inhalt",
          body: [`${OPERATOR.name}, ${OPERATOR.city}`],
        },
        {
          heading: "Keine Rechtsdienstleistung",
          body: [
            "Die App erklärt Dokumente in allgemein verständlicher Sprache und erstellt Textvorschläge. Sie erbringt keine Rechtsdienstleistung im Sinne des Rechtsdienstleistungsgesetzes (RDG) und ersetzt keine Beratung durch eine Rechtsanwältin, einen Rechtsanwalt oder eine anerkannte Beratungsstelle.",
            "Alle Auskünfte sind unverbindliche Hinweise. Für Entscheidungen mit rechtlichen Folgen, insbesondere bei Fristen, Kündigungen oder Forderungen, ist die Prüfung des Originals und rechtlicher Rat erforderlich.",
          ],
        },
        {
          heading: "Haftung für Inhalte und Links",
          body: [
            "Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.",
            "Für Inhalte externer Links sind ausschließlich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.",
          ],
        },
        {
          heading: "Urheberrecht",
          body: [
            "Die durch die Betreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der gesetzlichen Grenzen bedürfen der schriftlichen Zustimmung.",
          ],
        },
        {
          heading: "Verbraucherstreitbeilegung",
          body: [
            "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des Verbraucherstreitbeilegungsgesetzes (VSBG) teilzunehmen.",
          ],
        },
      ]}
    />
  );
}

export function DatenschutzScreen() {
  return (
    <LegalPage
      title="Datenschutz"
      intro="Was mit deinen Angaben passiert, in einfacher Sprache und nach DSGVO."
      sections={[
        {
          heading: "Verantwortlicher",
          body: [
            `Verantwortlich für die Datenverarbeitung ist ${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, E-Mail ${OPERATOR.email}.`,
          ],
        },
        {
          heading: "Welche Daten verarbeitet werden",
          body: [
            "Du kannst ohne Konto und ohne Anmeldung arbeiten. Verarbeitet werden nur die Inhalte, die du selbst eingibst oder hochlädst: der Text eines Briefes, ein Foto oder Scan davon, deine Schilderung und deine Chat-Nachrichten.",
            "Es gibt keine Anmeldung, keine Profile, keine Cookies zur Werbung und kein Tracking. Wir legen keine Datenbank an, in der deine Fälle gespeichert bleiben.",
          ],
        },
        {
          heading: "Wo deine Eingaben hingehen",
          body: [
            "Damit die App den Text erklären, Fristen erkennen und einen Antwortbrief entwerfen kann, wird dein Text an einen KI-Dienst übertragen: Google (Gemini API) und, wenn dieser nicht antwortet, an Groq, Inc. Bilder werden zur Texterkennung an Google übertragen.",
            "Die App selbst läuft bei Render (Hosting des Servers) und wird über Cloudflare Pages ausgeliefert. Dabei können technische Verbindungsdaten wie IP-Adresse und Zeitpunkt anfallen.",
            "Bei diesen Anbietern kann eine Verarbeitung außerhalb der EU, insbesondere in den USA, stattfinden. Es gelten zusätzlich deren Datenschutzbedingungen.",
          ],
        },
        {
          heading: "Rechtsgrundlage",
          body: [
            "Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO (Nutzung des von dir angeforderten Dienstes) und Buchstabe f DSGVO (Interesse an einem sicheren, funktionierenden Betrieb). Eine Weitergabe zu Werbezwecken findet nicht statt.",
          ],
        },
        {
          heading: "Speicherdauer",
          body: [
            "Deine Eingaben werden nicht dauerhaft gespeichert. Sie bleiben nur für die Dauer der Anfrage im Arbeitsspeicher des Servers. Wenn du die Seite schließt, sind sie weg.",
            "Technische Protokolle der genannten Anbieter können zeitlich begrenzt anfallen; darauf haben wir nur den Einfluss, den der jeweilige Anbieter einräumt.",
          ],
        },
        {
          heading: "Deine Rechte",
          body: [
            "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.",
            "Da wir keine Fall-Daten speichern, betrifft eine Löschung in der Regel nur Protokolle. Melde dich dafür per E-Mail an die oben genannte Adresse.",
            "Du kannst dich außerdem bei einer Aufsichtsbehörde beschweren, für Nordrhein-Westfalen ist das die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen.",
          ],
        },
        {
          heading: "Wichtiger Hinweis",
          body: [
            "Lade keine Dokumente hoch, die du nicht mit einem KI-Anbieter teilen möchtest. Bei sehr sensiblen Unterlagen ist es besser, nur die entscheidenden Absätze einzutippen.",
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 48 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 6 },
  intro: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heading: { color: colors.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 8 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  footer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 8 },
});
