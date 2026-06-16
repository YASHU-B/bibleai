const responses: Record<string, { en: string; te: string }> = {
  hi: {
    en: 'Hello! I am your Bible assistant. Ask me about faith, prayer, or Bible verses.',
    te: 'నమస్కారం! నేను మీ బైబిల్ సహాయకుడు. మీకు ఆధ్యాత్మిక ప్రశ్నలకు, వాక్య అర్థాలకు మరియు ప్రార్థనలకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను.',
  },
  hey: {
    en: 'Hello! I am your Bible assistant. Ask me about faith, prayer, or Bible verses.',
    te: 'హే! నేను మీ బైబిల్ సహాయకుడిని. మీ ఆధ్యాత్మిక ప్రశ్నలకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను.',
  },
  'hi there': {
    en: 'Hello! I am your Bible assistant. Ask me about faith, prayer, or Bible verses.',
    te: 'హాయ్! నేను మీ బైబిల్ సహాయకుడిని. మీ ఆధ్యాత్మిక ప్రశ్నలకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను.',
  },
  'good morning': {
    en: 'Good morning! I am your Bible assistant, here to help you with scripture and prayer.',
    te: 'శుభోదయం! నేను మీ బైబిల్ సహాయకుడిని. మీరు శ్లోకం మరియు ప్రార్థనల గురించి తెలుసుకోవడానికి నేను ఇక్కడ ఉన్నాను.',
  },
  'good evening': {
    en: 'Good evening! I am your Bible assistant, ready to answer spiritual questions.',
    te: 'శుభ సాయంత్రం! నేను మీ బైబిల్ సహాయకుడిని, ఆధ్యాత్మిక ప్రశ్నలకు సమాధానమివ్వడానికి సిద్ధంగా ఉన్నాను.',
  },
  'good night': {
    en: 'Good night! May God bless your rest and give you peace.',
    te: 'శుభ రాత్రి! దేవుడు మీ విశ్రాంతికి ఆశీర్వదించ గాక, మీకు శాంతి ఇవ్వగాక.',
  },
  'hello there': {
    en: 'Hello there! Ask me about faith, prayer, or Bible verses.',
    te: 'హలో! భక్తి, ప్రార్థన లేదా బైబిల్ వచనాల గురించి అడగండి.',
  },
  'who are you': {
    en: 'I am your Bible assistant, here to help you understand scripture and pray.',
    te: 'నేను మీ బైబిల్ సహాయకుడిని. నేను మీకు వచనం అర్ధం చేసుకోవడంలో మరియు ప్రార్థనలలో సహాయపడతాను.',
  },
  'what is prayer': {
    en: 'Prayer is talking with God. It is a time to ask, thank, and listen.',
    te: 'ప్రార్థన అనేది దేవుడితో మాట్లాడటం. ఇది అడగడానికి, ధన్యవాదాలు చెప్పడానికి మరియు వినడానికి సమయం.',
  },
  'what is prayer in telugu': {
    en: 'Prayer in Telugu means ప్రార్థన. It is speaking to God with faith and gratitude.',
    te: 'తెలుగులో ప్రార్థన అంటే దేవునితో విశ్వాసం మరియు కృతజ్ఞతతో మాట్లాడటం.',
  },
  hello: {
    en: 'Hello! I am your Bible assistant. Ask me about faith, prayer, or Bible verses.',
    te: 'నమస్కారం! నేను మీ బైబిల్ సహాయకుడు. మీకు ఆధ్యాత్మిక ప్రశ్నలకు, వాక్య అర్థాలకు మరియు ప్రార్థనలకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను.',
  },
  'who is jesus': {
    en: 'Jesus Christ is the Son of God and the Savior according to the Bible.',
    te: 'యేసు క్రీస్తు బైబిల్ ప్రకారం దేవుని కుమారుడు మరియు రక్షకుడు. ఆయన ప్రేమ, క్షమ, మరియు త్యాగం దృష్టాంతంగా నిలుస్తాడు.',
  },
  'what is the bible': {
    en: 'The Bible is the holy scripture of Christianity. It contains the Old Testament and the New Testament.',
    te: 'బైబిల్ క్రైస్తవుల పవిత్ర గ్రంథం. ఇది పూర్వ ఒప్పందం మరియు నూతన ఒప్పందంతో కూడి ఉంటుంది.',
  },
  'tell me about the bible': {
    en: 'The Bible is the holy scripture of Christianity. It contains the Old Testament and the New Testament.',
    te: 'బైబిల్ క్రైస్తవుల పవిత్ర గ్రంథం. ఇది పూర్వ ఒప్పందం మరియు నూతన ఒప్పందంతో కూడి ఉంటుంది.',
  },
  prayer: {
    en: 'Prayer: "God, please guide my heart and give me strength through your word."',
    te: 'ప్రార్థన: "దేవుడա, నీ దారి చూపి మా హృదయాలకు శాంతి కలిపేలా ఆశీర్వదించుము."',
  },
  'pray': {
    en: 'Pray with these words: "Dear God, be with me and give me strength in this hour."',
    te: 'దేవుని సమీపం కోసం ఈ సట్లను చేయండి: "ప్రియమైన దేవుడా, నన్ను నీ వారధిగా నిలుపుకొని నన్ను నీ దారిలో నడపుము."',
  },
  'prayer for exam': {
    en: 'Prayer for exams: "God, calm my mind and give me wisdom as I prepare."',
    te: 'పరీక్షల కోసం ప్రార్థన: "దేవుడా, నా మనసును ప్రశాంతం చేసి నాకు జ్ఞానాన్ని ఇవ్వుమని పరీక్ష సమయంలో ప్రార్థించును."',
  },
  'tell me about prayer': {
    en: 'Prayer is talking with God. It is a time to ask, thank, and listen.',
    te: 'ప్రార్థన అనేది దేవుడితో మాట్లాడటం. ఇది అడగడానికి, ధన్యవాదాలు చెప్పడానికి మరియు వినడానికి సమయం.',
  },
  'who am i': {
    en: 'You are a child of God. I am here to help you understand scripture and grow in faith.',
    te: 'మీరు దేవుని కుమారుడు/కుమార్తె. నేను మీకు శ్లోకాన్ని అర్థం చేసుకోవడంలో మరియు విశ్వాసంలో ఎదగడంలో సహాయపడటానికి ఉంటాను.',
  },
  'who is jesus in telugu': {
    en: 'Jesus Christ is the Son of God and the Savior. In Telugu, he is known as యేసు క్రీస్తు.',
    te: 'యేసు క్రీస్తు గురించి: ఆయన బైబిల్ ప్రకారం దేవుని కుమారుడు మరియు మనల్ని పాపమునుండి రక్షించేందుకు వచ్చిన రక్షకుడు.',
  },
  'what is the bible in telugu': {
    en: 'The Bible is a holy book. In Telugu, it is called బైబిల్ and contains scripture for Christians.',
    te: 'బైబిల్ ఒక పవిత్ర గ్రంథం. ఇది క్రైస్తవ మతానికి ప్రాథమిక సూక్తులు మరియు సిద్ధాంతాలను అందిస్తుంది.',
  },
  'prayer in telugu': {
    en: 'Prayer in Telugu: "దేవుడా, నీ ప్రేమతో నాకు బలాన్ని, నీ జ్ఞానంతో నాకు నిర్ణయశక్తిని ఇవ్వుము."',
    te: 'ప్రార్థన: "దేవుడా, నీ ప్రేమతో నాకు బలాన్ని, నీ జ్ఞానంతో నాకు నిర్ణయశక్తిని ఇవ్వుము."',
  },
  'john 3 16': {
    en: 'John 3:16 is a powerful verse about God’s love: "For God so loved the world..."',
    te: 'యోహాను 3:16 ఒక అపూర్వ వచనం: దేవుడు లోకాన్ని ఇంతగా ప్రేమించాడు కాబట్టి తన ఏకైక కుమారుడిని ఇచ్చాడు...',
  },
  'యోహాను 3 16': {
    en: 'John 3:16 is a powerful verse about God’s love. It says whoever believes in him should not perish but have eternal life.',
    te: 'యోహాను 3:16 (సారాంశం): దేవుని ప్రేమ ఎంతో గొప్పది. ఆయనను నమ్మినవారందరూ శాశ్వత జీవితం పొందుతారు.',
  },
  'psalm 23': {
    en: 'Psalm 23 says the Lord is my shepherd; I shall not want. He leads me beside still waters.',
    te: 'ఆయన నా తోడయాడు; నాకు అన్నీ సరిపడును. ఆయన నన్ను హరిత పసుపులపై నడిపించుచున్నాడు.',
  },
  'explain psalm 23': {
    en: 'Psalm 23 says the Lord is my shepherd; I shall not want. He leads me beside still waters.',
    te: 'కీర్తన 23 లో దేవుడు మా పశువులవంటి గొప్ప మార్గదర్శి. ఆయన మనం భయపడకుండా, విశ్రాంతిగా ఉన్న చోటే నడిపిస్తాడు.',
  },
  'కీర్తన 23': {
    en: 'Psalm 23 means the Lord is my shepherd. In Telugu, it is a promise of God’s care and peace.',
    te: 'యెహోవా నా పార్థీవ కోపానికి కాపాడనాడు. నేను శాంతిగా ఉంటాను.',
  },
  'కీర్తన 23 వివరించు': {
    en: 'Psalm 23 says the Lord is my shepherd; I shall not want. He leads me beside still waters.',
    te: 'కీర్తన 23 లో దేవుడు మా పశువులవంటి గొప్ప మార్గదర్శి. ఆయన మనం భయ없이, విశ్రాంతిగా ఉన్న చోటే నడిపిస్తాడు.',
  },
  'అంతం చెప్పు': {
    en: 'What would you like to know more about? I can share Bible passages, prayers, or spiritual guidance.',
    te: 'మీకు ఏ అంశం గురించి మరింత తెలుసుకోవాలి? నేను బైబిల్ నుండి సమాచారం, ప్రార్థనలు లేదా వచనాలను అందించగలను.',
  },
  'తెలుగు వచనాలు': {
    en: 'I can share Telugu Bible verses or explain them in Telugu. Ask for John 3:16, Psalm 23, or Matthew 5:9.',
    te: 'నేను మీకు తెలుగు బైబిల్ వచనాలను లేదా వాటి భావాలను అందించగలను. అడగండి: యోహాను 3:16, కీర్తన 23, లేదా మత్తయి 5:9.',
  },
  'ఆందోళనకు వచ్యాలు': {
    en: 'For comfort and peace, read passages like Isaiah 41:10 and Psalm 23.',
    te: 'యెషయా 41:10: "నిన్ను భయపడవద్దను, నేను నీతో ఉన్నాను".',
  },
  'పరీక్షల కోసం ప్రార్థన': {
    en: 'Prayer for exams: "God, calm my mind and give me wisdom as I prepare."',
    te: 'దేవుడా, నా మనసును ప్రశాంతం చేసి నాకు జ్ఞానాన్ని అందించుమని ప్రార్థించును.',
  },
  'ఆశయాలు': {
    en: 'I can share Bible verses about faith, belief, and love.',
    te: 'భక్తి, నమ్మకం మరియు ప్రేమ మీద నేను మీకు బైబిల్ వచనాలను చెప్పగలను.',
  },
  'proverbs 3 5 6': {
    en: 'Proverbs 3:5-6 says: Trust in the Lord with all your heart and do not lean on your own understanding.',
    te: 'ప్రవాక్యం 3:5-6: "నువ్వు నీ గుండెను యెహోవాపై నమ్ము, నీ స్వీయ బుద్ధిని ఆధారంగా పెట్టకు..."',
  },
  'proverbs 3:5-6 meaning': {
    en: 'Proverbs 3:5-6 says: Trust in the Lord with all your heart and do not lean on your own understanding. He will make your paths straight.',
    te: 'ప్రవాక్యం 3:5-6: "యెహోవాపై నమ్మకంగా ఉండండి, మీ స్వీయ జ్ఞానంపై ఆధారపడకండి. ఆయన మీ మార్గాన్ని నిలువు చేస్తాడు."',
  },
  'ప్రోవరబ్స్ 3:5-6 అర్థం': {
    en: 'Proverbs 3:5-6 says: Trust in the Lord with all your heart and do not lean on your own understanding. He will make your paths straight.',
    te: 'ప్రవాక్యం 3:5-6: "యెహోవాపై నమ్మకంగా ఉండండి, మీ స్వీయ జ్ఞానంపై ఆధారపడకండి. ఆయన మీ మార్గాన్ని నిలువు చేస్తాడు."',
  },
};

function normalize(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s:]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type Language = 'te' | 'en';

export function getLocalAssistantResponse(input: string, language: Language = 'te'): string | null {
  const normalized = normalize(input);
  if (!normalized) return null;
  if (responses[normalized]) return responses[normalized][language];

  const sortedKeys = Object.keys(responses).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) return responses[key][language];
  }

  return null;
}
