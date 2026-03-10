/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Il tuo link di accesso per {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Il tuo link di accesso</Heading>
        <Text style={text}>
          Clicca il pulsante qui sotto per accedere a {siteName}. Il link scadrà a breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accedi
        </Button>
        <Text style={footer}>
          Se non hai richiesto questo link, puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(265, 4%, 12.9%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(257, 4.6%, 55.4%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: 'hsl(266, 4%, 20.8%)',
  color: 'hsl(248, 0.3%, 98.4%)',
  fontSize: '14px',
  borderRadius: '0.375rem',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
