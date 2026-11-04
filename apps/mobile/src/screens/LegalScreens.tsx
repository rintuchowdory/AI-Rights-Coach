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
        Stand: 4. November 2026. Diese Seite beschreibt den technischen Stand der veröffentlichten App auf ai-rights-coach.pages.dev.
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
          heading: "Kurz gesagt",
          body: [
            "Die App funktioniert ohne Konto und ohne Anmeldung. Sie setzt keine Cookies, legt keinen Speicher in deinem Browser an und legt keine Datenbank an, in der deine Briefe oder Fälle bleiben.",
            "Deine Eingaben werden nur übertragen, damit die Analyse, die Fristenerkennung oder der Briefentwurf entstehen kann, den du gerade auslöst.",
          ],
        },
        {
          heading: "Welche Daten verarbeitet werden",
          body: [
            "Nur das, was du selbst eingibst oder hochlädst: der Text eines Briefes, ein Foto oder Scan davon, deine Schilderung und deine Chat-Nachrichten.",
            "Dazu fallen technische Verbindungsdaten an, die jeder Webserver sieht: IP-Adresse, Zeitpunkt, abgerufene Adresse und Browser-Kennung.",
          ],
        },
        {
          heading: "Wo verarbeitet wird",
          body: [
            "Der Server der App läuft in Frankfurt am Main, also innerhalb der EU (Anbieter: Render). Die App-Dateien werden über Cloudflare Pages ausgeliefert.",
            "Für die Textanalyse und die Texterkennung von Bildern wird dein Inhalt an Google (Gemini API) übertragen. Antwortet Google nicht, übernimmt Groq, Inc. Beide Anbieter verarbeiten in Rechenzentren in den USA.",
            "Groq speichert deine Ein- und Ausgaben standardmäßig nicht. Nur zur Fehlersuche oder Missbrauchsprüfung können Protokolle bis zu 30 Tage aufbewahrt werden; das lässt sich in den Konto-Einstellungen abstellen. Für Übermittlungen in die USA stützt sich Groq auf die EU-Standardvertragsklauseln.",
            "Google verwendet bei kostenpflichtiger Nutzung deine Inhalte nicht zur Verbesserung seiner Produkte. Für Nutzerinnen und Nutzer im Europäischen Wirtschaftsraum gelten diese Bedingungen auch beim kostenlosen Kontingent. Außerhalb des EWR kann Google bei kostenlosem Kontingent eingesandte Inhalte zur Produktverbesserung nutzen und von Menschen prüfen lassen.",
          ],
        },
        {
          heading: "Rechtsgrundlage",
          body: [
            "Artikel 6 Absatz 1 Buchstabe b DSGVO: die Verarbeitung ist nötig, um den von dir angeforderten Dienst zu erbringen.",
            "Artikel 6 Absatz 1 Buchstabe f DSGVO: berechtigtes Interesse an einem sicheren, stabilen und missbrauchsfreien Betrieb.",
            "Eine Weitergabe zu Werbezwecken oder ein Verkauf von Daten findet nicht statt.",
          ],
        },
        {
          heading: "Speicherdauer",
          body: [
            "Deine Eingaben werden nicht dauerhaft gespeichert. Sie liegen nur für die Dauer der Anfrage im Arbeitsspeicher des Servers und sind nach dem Schließen der Seite weg.",
            "Was die Anbieter während der Verarbeitung technisch protokollieren, richtet sich nach deren Vorgaben (bei Groq höchstens 30 Tage zur Missbrauchsprüfung).",
          ],
        },
        {
          heading: "Deine Rechte",
          body: [
            "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.",
            "Da wir keine Fall-Daten speichern, betrifft eine Löschung in der Regel nur Protokolle. Eine Nachricht an die oben genannte E-Mail-Adresse genügt.",
            "Du kannst dich bei einer Aufsichtsbehörde beschweren. Zuständig für Nordrhein-Westfalen ist die Landesbeauftragte für Datenschutz und Informationsfreiheit, Kavalleriestraße 2 bis 4, 40213 Düsseldorf, www.ldi.nrw.de.",
          ],
        },
        {
          heading: "Sicherheit",
          body: [
            "Die Übertragung zwischen deinem Gerät und dem Server erfolgt verschlüsselt über HTTPS. Die Anfragen werden nicht in einer Weise gespeichert, die Rückschlüsse auf deine Person erlaubt.",
          ],
        },
        {
          heading: "Wichtig für dich",
          body: [
            "Lade keine Dokumente hoch, die du nicht mit einem KI-Anbieter teilen möchtest. Bei sehr sensiblen Unterlagen ist es besser, nur die entscheidenden Absätze einzutippen.",
            "Lade auch keine Unterlagen anderer Personen hoch, wenn du dafür keine Erlaubnis hast.",
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
