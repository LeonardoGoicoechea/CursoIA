# Matriz de campos

El frontend, el backend y Google Sheets deben mantener el mismo contrato de campos. El backend rechaza campos fuera de esta matriz.

## Base

Cada envio agrega:

| Campo | Origen |
| --- | --- |
| `savedAt` | Backend |
| `timestamp` | Frontend |
| `submissionId` | Frontend |
| `participantId` | Frontend |
| `module` | Frontend |
| `appVersion` | `config.js` |
| `payloadJson` | Backend |

## Modulos

| Modulo | Hoja | Campos |
| --- | --- | --- |
| `profile` | `Perfiles` | `fullName`, `email`, `phone`, `age`, `role`, `industry`, `aiExperience`, `participantType`, `personalGoal`, `consent` |
| `thermometer1` | `Termometro1` | `repetitiveTasks`, `frequency`, `weeklyTime`, `energyDrain`, `delegationRisk`, `humanCriteria` |
| `thermometer2` | `Termometro2` | `fearLagging`, `fearBadDelegation`, `overload`, `experimentConfidence`, `opportunity` |
| `case` | `CasosReales` | `realProblem`, `context`, `currentInput`, `expectedOutput`, `aiAssistance`, `humanDecision`, `aiBoundary`, `risks` |
| `flow` | `Flujos` | `currentFlow`, `newFlow`, `delegatedStep`, `supervisedStep`, `preservedStep`, `improvementMetric` |
| `experiment` | `Experimentos` | `testedAction`, `toolUsed`, `timeBefore`, `timeAfter`, `result`, `humanCorrections`, `learning`, `nextAdjustment` |
| `manifesto` | `Manifiestos` | `willDelegate`, `willPreserve`, `ethicalLimit`, `verificationPractice`, `thirtyDayCommitment`, `signature` |

## Limites

- Email: 254 caracteres y formato basico de email.
- `consent`: valor obligatorio `true`.
- Campos cortos: 160 caracteres.
- Telefono: 40 caracteres.
- Edad: 20 caracteres.
- Campos de desarrollo medio: 1200 caracteres.
- Campos largos de reflexion/caso/flujo/experimento/manifiesto: 2400 caracteres.
- `payloadJson`: maximo 30000 caracteres.

Si se agrega o renombra un campo, actualizar en este orden:

1. `index.html`
2. `app.js` (`MODULE_FIELDS`)
3. `scripts/google-apps-script.js` (`MODULES` y `FIELD_RULES`)
4. `docs/field-matrix.md`
5. `node tools/smoke-test.js`
