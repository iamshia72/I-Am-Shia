
import fs from 'fs';

const filePath = 'src/data/duas.json';
const content = fs.readFileSync(filePath, 'utf8');

// Find the start of the corruption
const startMarker = 'أَسْأَلُكَ يَا اللَّهُ أَنْ لَا تُشَوِّهَ خَلْقِي بِالنَّارِ';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
  console.error('Start marker not found');
  process.exit(1);
}

// Find the end of the corruption (beginning of the next dua)
const endMarker = '"id": "dua-after-ziyarat-ashura-imam-husain"';
const endIndex = content.indexOf(endMarker);

if (endIndex === -1) {
  console.error('End marker not found');
  process.exit(1);
}

// We want to keep everything up to the object containing the start marker, 
// then replace everything until the start of the next dua.

// Let's refine the markers to be more precise.
// The startIndex is inside an object. We want to find the opening brace of that object.
const openingBraceIndex = content.lastIndexOf('{', startIndex);

// The endIndex is inside the next dua's metadata. We want to find the opening brace of THAT dua's object.
const nextDuaOpeningBrace = content.lastIndexOf('{', endIndex);

const part1 = content.slice(0, openingBraceIndex);
const part2 = content.slice(nextDuaOpeningBrace);

const duaYamanEndingLines = `      {
        "arabic": "أَسْأَلُكَ يَا اللَّهُ أَنْ لَا تُشَوِّهَ خَلْقِي بِالنَّارِ",
        "english": "I beseech You O God not to make my being ugly by the Fire.",
        "transliteration": "as'aluka ya allahu an la tushawwiha khalqi bin nar",
        "urdu": "میں تجھ سے سوال کرتا ہوں اے اللہ! کہ میرے وجود کو آگ سے مسخ نہ فرمانا،"
      },
      {
        "arabic": "يَا رَبَّاهُ يَا سَيِّدَاهُ يَا مَوْلَاهُ",
        "english": "O My Lord, O My Master, O My Guardian.",
        "transliteration": "Ya Rabbahu Ya Sayyidahu Ya Mawlahu",
        "urdu": "اے میرے پروردگار، اے میرے سردار، اے میرے مولیٰ۔"
      }
    ]
  },
  {
    "id": "dua-saif-saghir-qamoos",
    "title": "Dua Saif Saghir (Qamoos)",
    "category": "Special",
    "type": "supplication",
    "description": "This is a great and honorable supplication known as the 'Small Sword' or 'Dua al-Qamoos'. It is attributed to Imam Ali (a.s.).",
    "audioUrl": "https://mp3.duas.org/saify_saghir.mp3",
    "lines": [
      {
        "arabic": "بِسْمِ ٱللَّهِ ٱلرَّحْمٰنِ ٱلرَّحِيمِ",
        "english": "In the name of Allah, the Beneficent, the Merciful.",
        "transliteration": "bismi allahi alrrahmani alrrahimi",
        "urdu": "اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے"
      },
      {
        "arabic": "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ",
        "english": "O Allah, (please do) send blessings to Muhammad and the Household of Muhammad,",
        "transliteration": "allahumma salli \`ala muhammadin wa ali muhammadin",
        "urdu": "اے اللہ محمدؐ اور آل محمدؐ پر رحمت نازل فرما"
      },
      {
        "arabic": "رَبِّ اَدْخِلْني في لُجَّةِ بَحْرِ اَحَدِيَّتِكَ",
        "english": "O my Lord, put me in the depth of the sea of Your oneness,",
        "transliteration": "Rabbi adkhilni fi lujjati bahri ahadiyyatik",
        "urdu": "اے میرے پروردگار! مجھے اپنی توحید کے بحر کی گہرائی میں داخل فرما،"
      },
      {
        "arabic": "وَطَمْطامِ يَمِّ وَحْدانِيَّتِكَ",
        "english": "and the middle (deep) of the ocean of Your uniqueness,",
        "transliteration": "wa tamtami yammi wahdaniyyatik",
        "urdu": "اور اپنی وحدانیت کے سمندر کے عین وسط میں،"
      },
      {
        "arabic": "وَقَوِّني بِسَطْوَةِ سُلْطانِ عِزَّتِكَ",
        "english": "and strengthen me with the power of the authority of Your might,",
        "transliteration": "wa qawwini bisatwati sultani 'izzatik",
        "urdu": "اور اپنی عزت کے غلبے کی قوت سے مجھے طاقت عطا فرما،"
      },
      {
        "arabic": "حَتّى اَخْرُجَ اِلى فَضاءِ سَعَةِ رَحْمَتِكَ",
        "english": "until I emerge into the vast space of Your mercy,",
        "transliteration": "hatta akhruja ila fada'i sa'ati rahmatik",
        "urdu": "یہاں تک کہ میں تیری رحمت کی وسعت کی فضا میں نکل آؤں،"
      },
      {
        "arabic": "وَفي وَجْهي لَمَعاتُ بَرْقِ قُرْبِكَ",
        "english": "and in my face flashes of lightning of Your closeness,",
        "transliteration": "wa fi wajhi lama'atu barqi qurbik",
        "urdu": "اور میرے چہرے پر تیرے قرب کی بجلیوں کی چمک ہو،"
      },
      {
        "arabic": "مَسْبِياً بِهَيْبَتِكَ، عَزيزاً بِعِنايَتِكَ",
        "english": "captured by Your awe, mighty by Your care,",
        "transliteration": "masbiyan bihaybatik, 'azizun bi 'inayatik",
        "urdu": "تیرہی ہیبت کا اسیر، تیری عنایت سے معزز،"
      },
      {
        "arabic": "جَليلاً بِتَجَلّيكَ، سامِياً بِقُرْبِكَ",
        "english": "majestic by Your manifestation, exalted by Your closeness,",
        "transliteration": "jalilun bitajallik, samiyan biqurbika",
        "urdu": "تیری تجلی سے بلند مرتبہ، تیرے قرب سے عالی شان،"
      },
      {
        "arabic": "مُبيناً بِتَمْكينِكَ، وَاَلْبِسْني خِلَعَ الْعِزِّ وَالْقَبُولِ",
        "english": "prominent by Your prominence, and clothe me with the robes of might and acceptance,",
        "transliteration": "mubinan bitamkinik, wa albisni khila'al 'izzi wal qabuli",
        "urdu": "تیری قدرت کے سبب نمایاں، اور مجھے عزت اور مقبولیت کے لباس پہنا،"
      },
      {
        "arabic": "وَسَهِّلْ لي مَناهِجَ الْوُصُولِ وَالْوُصُولِ",
        "english": "and easy for me the paths of access and arrival,",
        "transliteration": "wa sahhil li manahijal wusuli wal wusul",
        "urdu": "اور میرے لیے (تک) پہنچنے اور وصال کے راستوں کو آسان کر دے،"
      },
      {
        "arabic": "وَتَوِّجْني بِتاجِ الْكَرامَةِ وَالْوَقارِ",
        "english": "and crown me with the crown of majesty and grace,",
        "transliteration": "wa tawwijni bitajil karamati wal waqar",
        "urdu": "اور مجھے کرامت و وقار کا تاج پہنا،"
      },
      {
        "arabic": "وَاَلِّفْ بَيْني وَبَيْنَ اَحِبّائِكَ فِي دِياراتِ الدُّنْيا وَدِياراتِ الآخِرَةِ",
        "english": "and join me with Your friends in the lands of the world and the lands of the hereafter,",
        "transliteration": "wa allif bayni wa bayna ahibba'ika fi diyaratid dunya wa diyaratil akhirah",
        "urdu": "اور میرے اور تیرے دوستوں کے درمیان دنیا و آخرت کے گھروں میں الفت پیدا فرما،"
      },
      {
        "arabic": "وَارْزُقْني مِنْ نُورِ اسْمِكَ هَيْبَةً وَسَطْوَةً تَنْقادُ لِيَ الْقُلُوبُ وَالأَرْواحُ",
        "english": "and provide me with awe and power from the light of Your Name, that hearts and spirits may follow me,",
        "transliteration": "warzuqni min nuri ismika haybatan wa satwatan tanqadu liyal qulubu wal arwah",
        "urdu": "اور مجھے اپنے نام کے نور سے ایسی ہیبت و قدرت عطا فرما کہ دل اور روحیں میرے تابع ہو جائیں،"
      },
      {
        "arabic": "وَتَخْضَعُ لَدَيَّ النُّفُوسُ وَالأَشْباحُ",
        "english": "and souls and forms may humble themselves before me,",
        "transliteration": "wa takhda'u ladayyan nufusu wal ashbah",
        "urdu": "اور نفوس اور جسد میرے سامنے عاجزی کریں،"
      },
      {
        "arabic": "يَا مَنْ ذَلَّتْ لَهُ رِقابُ الْجَبابِرَةِ وَخَضَعَتْ لَدَيْهِ اَعْناقُ الْاَكاسِرَةِ",
        "english": "O You before whom the necks of the tyrants are humbled and the necks of the kings are lowered,",
        "transliteration": "Ya man dhallat lahu riqabul jababira wa khada'at ladayhi a'naqul akasirah",
        "urdu": "اے وہ جس کے سامنے سرکشوں کی گردنیں جھک گئیں اور بادشاہوں کی گردنیں خم ہو گئیں،"
      },
      {
        "arabic": "لا مَلْجَاَ وَلا مَنْجا مِنْكَ اِلّا اِلَيْكَ",
        "english": "there is no refuge and no escape from You except to You,",
        "transliteration": "la malja'a wa la manja minka illa ilayk",
        "urdu": "تیرے سوا تجھ سے نہ کوئی پناہ ہے اور نہ کوئی جائے نجات،"
      },
      {
        "arabic": "وَلا اِعانَةَ اِلّا بِكَ وَلا اِتِّكاءَ اِلّا عَلَيْكَ",
        "english": "and no help except by You and no reliance except on You,",
        "transliteration": "wa la i'anata illa bika wa la ittika'a illa 'alayk",
        "urdu": "اور تیرے سوا کوئی مدد نہیں اور تیرے سوا کسی پر بھروسہ نہیں،"
      },
      {
        "arabic": "اِدْفَعْ عَنّي كَيْدَ الْحاسِدينَ وَظُلُماتِ شَرِّ الْمُعانِدينَ",
        "english": "defend me from the plot of the enviers and the darkness of the evil of the stubborn,",
        "transliteration": "idfa' 'anni kaydal hasidina wa dulumati sharril mu'anidin",
        "urdu": "مجھ سے حاسدوں کی چالیں اور ضدی دشمنوں کے شر کی تاریکیاں دور فرما،"
      },
      {
        "arabic": "وَاَدْخِلْني في حِمى رَحْمَتِكَ وَحِصْنِ ظِلِّكَ",
        "english": "and put me in the protection of Your mercy and the fortress of Your shadow,",
        "transliteration": "wa adkhilni fi hima rahmatika wa hisni dilliq",
        "urdu": "اور مجھے اپنی رحمت کی پناہ اور اپنے سائے کے قلعے میں داخل فرما،"
      },
      {
        "arabic": "وَاَذِلَّ لي اَعْدائي فِي كُلِّ حال",
        "english": "and humiliate my enemies for me in every state,",
        "transliteration": "wa adhilla li a'da'i fi kulli hal",
        "urdu": "اور ہر حال میں میرے دشمنوں کو میرے سامنے ذلیل فرما،"
      },
      {
        "arabic": "وَانْصُرْني عَلى ظالِمي وَحاسِدي",
        "english": "and help me against my oppressors and my enviers,",
        "transliteration": "wansurni 'ala dhalimi wa hasidi",
        "urdu": "اور میرے ظالموں اور میرے حاسدوں پر میری مدد فرما،"
      },
      {
        "arabic": "وَاجْعَلْ لي مِنْ لَدُنْكَ سُلْطاناً نَصيراً",
        "english": "and make for me a supporting authority from Your presence,",
        "transliteration": "waj'al li mil ladunka sultanan nasira",
        "urdu": "اور اپنی طرف سے میرے لیے ایک مددگار قوت قرار دے،"
      },
      {
        "arabic": "وَنَجِّني مِنْ شَرِّ كُلِّ ذي شَرٍّ، وَمِنْ شَرِّ الْجِنِّ وَالْاِنْسِ",
        "english": "and save me from the evil of every evil-doer, and from the evil of the jinn and the men,",
        "transliteration": "wa najjini min sharri kulli dhi sharr, wa min sharril jinni wal ins",
        "urdu": "اور مجھے ہر شر والے کے شر سے، اور جنوں اور انسانوں کے شر سے نجات دے،"
      },
      {
        "arabic": "وَمِنْ شَرِّ الشَّياطينِ وَالْاَبالِيسِ، وَمِنْ شَرِّ الْفِتَنِ وَالْمِحَنِ",
        "english": "and from the evil of the devils and the Satans, and from the evil of the trials and the tribulations,",
        "transliteration": "wa min sharrish shayaitini wal abalis, wa min sharril fitani wal mihan",
        "urdu": "اور شیاطین و ابلیسوں کے شر سے، اور فتنوں اور آزمائشوں کے شر سے،"
      },
      {
        "arabic": "وَمِنْ شَرِّ كُلِّ دابَّةٍ اَنْتَ آخِذٌ بِناصِيَتِها، اِنَّ رَبّي عَلى صِراط مُسْتَقيم",
        "english": "and from the evil of every beast that You have grabbed by its forelock, indeed my Lord is on a straight path.",
        "transliteration": "wa min sharri kulli dabbatin anta akhidhun binasiyatiha, inna rabbi 'ala siratim mustaqim",
        "urdu": "اور ہر اس جاندار کے شر سے جس کی پیشانی تو نے پکڑ رکھی ہے، بیشک میرا رب سیدھے راستے پر ہے۔"
      },
      {
        "arabic": "اللَّهُمَّ يَا صَانِعَ كُلِّ مَصْنُوْعٍ، وَيَا جَابِرَ كُلِّ كَسِيْرٍ",
        "english": "O Allah, O Maker of every built thing, O Mender of every broken thing,",
        "transliteration": "allahumma ya sani'a kulli masnu', wa ya jabira kulli kasir",
        "urdu": "اے اللہ! اے ہر بننے والی چیز کے بنانے والے، اور اے ہر ٹوٹے ہوئے کو جوڑنے والے،"
      },
      {
        "arabic": "وَيَا مُؤْنِسَ كُلِّ وَحِيْدٍ، وَيَا صَاحِبَ كُلِّ غَرِيْبٍ",
        "english": "O Companion of every lonely person, O Friend of every stranger,",
        "transliteration": "wa ya mu'nisa kulli wahid, wa ya sahiba kulli gharib",
        "urdu": "اور اے ہر اکیلے کے غمگسار، اور اے ہر پردیسی کے ساتھی،"
      },
      {
        "arabic": "وَيَا شَاهِدَ كُلِّ نَجْوىٰ، وَيَا عَالِمَ كُلِّ خَفِيَّـةٍ",
        "english": "O Witness of every secret talk, O Knower of every hidden thing,",
        "transliteration": "wa ya shahida kulli najwa, wa ya 'alima kulli khafiyya",
        "urdu": "اور اے ہر سرگوشی کے گواہ، اور اے ہر چھپی ہوئی بات کے جاننے والے،"
      },
      {
        "arabic": "وَيَا شَرِيْفَ كُلِّ ذِيْ طَوْلٍ، وَيَا مُقْسِمَ لِكُلِّ مَحْرُوْمٍ",
        "english": "O Noble of every possessor of benefit, O Portioner for every deprived person,",
        "transliteration": "wa ya sharifa kulli dhi tawl, wa ya muqshima likulli mahrum",
        "urdu": "اور اے ہر فضل و کرم والے، اور اے ہر محروم کے لیے تقسیم کرنے والے،"
      },
      {
        "arabic": "وَيَا رَازِقَ كُلِّ مَرْزُوْقٍ، وَيَا قَادِرُ لِكُلِّ مَقْدُوْرٍ",
        "english": "O Provider of every provided person, O Possessor of power over each thing determined,",
        "transliteration": "wa ya raziga kulli marzuq, wa ya qadiru likulli maqdur",
        "urdu": "اور اے ہر رزق پانے والے کے رزق دینے والے، اور اے ہر مقدر پر قدرت رکھنے والے،"
      },
      {
        "arabic": "بِحَقِّ هٰذِهِ الْاَسْماءِ الْحُسْنىٰ وَالْاَسْماءِ الْعُظْمىٰ وَالْاَسْماءِ الشَّريفَةِ",
        "english": "By the sake of these Beautiful Names and the Greatest Names and the Noble Names,",
        "transliteration": "bihaqqi hadhihil asma'il husna wal asma'il 'uzma wal asma'ish sharifa",
        "urdu": "ان بہترین ناموں، اور عظیم ترین ناموں، اور بزرگ ناموں کے صدقے میں،"
      },
      {
        "arabic": "اَنْ تُصَلِّيَ عَلَىٰ مُحَمَّدٍ وَّ آلِ مُحَمَّدٍ",
        "english": "that You bless Muhammad and the household of Muhammad,",
        "transliteration": "an tusalliya 'ala muhammadin wa ali muhammad",
        "urdu": "کہ تو محمدؐ اور آل محمدؐ پر رحمت نازل فرما،"
      },
      {
        "arabic": "وَاَنْ تَجْعَلَ لي عِزّاً مِّنْ عِزِّكَ، وَنَصْراً مِّنْ نَصْرِكَ",
        "english": "and that You make for me a might from Your Might, and a victory from Your Victory,",
        "transliteration": "wa an taj'ala li 'izzam min 'izzika, wa nasram min nasrika",
        "urdu": "اور میرے لیے اپنی عزت سے ایک عزت قرار دے، اور اپنی نصرت سے ایک نصرت قرار دے،"
      },
      {
        "arabic": "وَفَرَجاً مِّنْ فَرَجِكَ، وَقَدْراً مِّنْ قَدْرِكَ، وَنُوراً مِّنْ نُورِكَ",
        "english": "and a relief from Your Relief, and a status from Your Power, and a light from Your Light,",
        "transliteration": "wa farajam min farajika, wa qadram min qadrika, wa nuram min nurika",
        "urdu": "اور اپنی کشائش سے ایک کشائش قرار دے، اور اپنی تقدیر سے ایک رتبہ قرار دے، اور اپنے نور سے ایک نور قرار دے،"
      },
      {
        "arabic": "وَاَنْ تَجْعَلَ لي جَمالاً مِّن_ جَمالِكَ، وَبَهاءً مِّنْ بَهائِكَ",
        "english": "and that You make for me a beauty from Your Beauty, and a splendor from Your Splendor,",
        "transliteration": "wa an taj'ala li jamalam min jamalika, wa baha'am min baha'ika",
        "urdu": "اور میرے لیے اپنے جمال سے ایک جمال قرار دے، اور اپنے کمال سے ایک کمال قرار دے،"
      },
      {
        "arabic": "وَهَيْبَةً مِّنْ هَيْبَتِكَ، وَسُلْطاناً مِّنْ سُلْطانِكَ",
        "english": "and an awe from Your Awe, and an authority from Your Authority,",
        "transliteration": "wa haybatam min haybatika, wa sultanam min sultanika",
        "urdu": "اور اپنی ہیبت سے ایک ہیبت قرار دے، اور اپنی قدرت سے ایک غلبہ قرار دے،"
      },
      {
        "arabic": "بِقُوَّتِكَ يَا قَوِيُّ مَنُّكَ يَا مَنَّانُ",
        "english": "by Your Strength, O Strong one! Your favor, O Gracious one!",
        "transliteration": "wa biquwwatika ya qawiyyu mannuka ya mannan",
        "urdu": "اور اپنی قوت کے واسطے اے قوی! اور اپنے احسان کے واسطے اے احسان کرنے والے!"
      },
      {
        "arabic": "اَنْ تُصَلِّيَ عَلَىٰ مُحَمَّدٍ وَّ آلِ مُحَمَّدٍ",
        "english": "that You bless Muhammad and the household of Muhammad,",
        "transliteration": "an tusalliya 'ala muhammadin wa ali muhammad",
        "urdu": "کہ تو محمدؐ اور آل محمدؐ پر رحمت نازل فرما،"
      },
      {
        "arabic": "وَاَنْ تُنْجِيَني مِنْ حَيَّاتِ الدُّنْيا وَاَوْجاعِ الآخِرَةِ",
        "english": "and that You save me from the serpents of the world and the pains of the hereafter,",
        "transliteration": "wa an tunjiyani min hayyatid dunya wa awja'il akhirah",
        "urdu": "اور کہ تو مجھے دنیا کے سانپوں اور آخرت کی تکلیفوں سے نجات عطا فرمائے،"
      },
      {
        "arabic": "وَوشَرِّ الشَّيطانِ، وَشَرِّ كُلِّ ذي شَرٍّ",
        "english": "and the evil of the Satan, and the evil of every evil-doer,",
        "transliteration": "wa sharrish shaytani, wa sharri kulli dhi sharr",
        "urdu": "اور شیطان کے شر سے، اور ہر صاحبِ شر کے شر سے،"
      },
      {
        "arabic": "بِحَقِّ مَنِ انْتَجَبْتَهُمْ لِنَفْسِكَ وَاحْتَجَبْتَ عَنْ جَميعِ خَلْقِكَ",
        "english": "by the sake of those whom You chose for Yourself and You veiled Yourself from all Your creation,",
        "transliteration": "bihaqqi manin tajabtahum linafsika wahtajabta 'an jami'i khalqika",
        "urdu": "ان کے صدقے میں جنہیں تو نے اپنی ذات کے لیے چن لیا اور اپنی تمام مخلوق سے پوشیدہ رہا،"
      },
      {
        "arabic": "فَلَمْ يُدْرِكُوا كُنْهَ عَظَمَتِكَ، وَجَعَلْتَهُمْ اَدِلَّاءَ عَلَيْكَ",
        "english": "so they did not comprehend the essence of Your Greatness and You made them guides to You,",
        "transliteration": "falam yudriku kunha 'azamatika, wa ja'altahum adilla'a 'alayka",
        "urdu": "پس وہ تیری عظمت کی گہرائی کو نہ پا سکے اور تو نے انہیں اپنی طرف رہنمائی کرنے والے قرار دیا،"
      },
      {
        "arabic": "وَالْمُبلِّغينَ عَنْكَ، وَالْمُؤَدِّينَ مَا اَمَرْتَهُمْ بِهِ",
        "english": "communicators from You, and executors of what You commanded them,",
        "transliteration": "wal muballighina 'anka, wal mu'addina ma amartahum bihi",
        "urdu": "تیری طرف سے پیغام پہنچانے والے، اور تیرے احکام بجا لانے والے،"
      },
      {
        "arabic": "وَاَنْ تَرْزُقَني مِن مَّواهبِ قُرْبِكَ اِلَيْهِمْ",
        "english": "and that You provide for me from the gifts of Your closeness to them,",
        "transliteration": "wa an tarzuqani min mawahibi qurbika ilayhim",
        "urdu": "اور مجھے ان کے قرب کی عطا میں سے رزق عطا فرما،"
      },
      {
        "arabic": "مَا تَرْفَعُ بِهِ قَدْري، وَتُعِزُّ بِهِ اَمْري، اِنَّكَ عَلى كُلِّ شَيْءٍ قَديرٌ",
        "english": "that by which You raise my status and honor my affair, Indeed, You have power over all things.",
        "transliteration": "ma tarfa'u bihi qadri, wa tu'izzu bihi amri, innaka 'ala kulli shay'in qadir",
        "urdu": "جس کے ذریعے تو میرا مرتبہ بلند کرے اور میرا معاملہ معزز بنائے، بیشک تو ہر چیز پر قادر ہے۔"
      },
      {
        "arabic": "إِلَهِي، إِذَا لَمْ أَسْأَلْكَ فَتُعْطِيَنِي، فَمَنْ ذَا الَّذِي أَسْأَلُهُ فَيُعْطِينِي؟",
        "english": "O my God! If I do not ask of Thee that Thou mayest give me, who is there that I may ask to give me?",
        "transliteration": "ilahi idha lam as’aluka fatu’tiyani, faman dhal-ladhi as’aluhu fayu’tini",
        "urdu": "اے میرے معبود! اگر میں تجھ سے سوال نہ کروں کہ تو مجھے عطا کرے، تو پھر کون ہے جس سے میں سوال کروں کہ وہ مجھے عطا کرے؟"
      },
      {
        "arabic": "إِلَهِي، إِذَا لَمْ أَدْعُوكَ فَتَسْتَجِيبَ لِي، فَمَنْ ذَا الَّذِي أَدْعُوهُ فَيَسْتَجِيبُ لِي؟",
        "english": "O my God! If I do not call on Thee that Thou mayest answer me, who is there that I may call on to answer me?",
        "transliteration": "ilahi idha lam ad’uka fatastajiba li, faman dhal-ladhi ad’uhu fayastajibu li",
        "urdu": "اے میرے معبود! اگر میں تجھے نہ پکاروں کہ تو میری دعا قبول کرے، تو پھر کون ہے جسے میں پکاروں کہ وہ میری دعا قبول کرے؟"
      },
      {
        "arabic": "إِلَهِي، إِذَا لَمْ أَتَضَرَّعْ إِلَيْكَ فَتَرْحَمَنِي، فَمَنْ ذَا الَّذِي أَتَضَرَّعُ إِلَيْهِ فَيَرْحَمُنِي؟",
        "english": "O my God! If I do not beseech Thee that Thou mayest have mercy on me, who is there that I may beseech to have mercy on me?",
        "transliteration": "ilahi idha lam atadarra’ ilayka fatarhamani, faman dhal-ladhi atadarra’u ilayhi fayarhamuni",
        "urdu": "اے میرے معبود! اگر میں تیرے سامنے گڑگڑاؤں نہیں کہ تو مجھ پر رحم کرے، تو پھر کون ہے جس کے سامنے میں گڑگڑاؤں کہ وہ مجھ پر رحم کرے؟"
      },
      {
        "arabic": "إِلَهِي، فَكَمَا فَلَقْتَ الْبَحْرَ لِمُوسَى عَلَيْهِ السَّلَامُ وَنَجَّيْتَهُ،",
        "english": "O my God! Just as Thou didst cleave the sea for Moses (peace be upon him) and savedst him,",
        "transliteration": "ilahi fakama falaqtal-bahra limusa ‘alayhis-salamu wa najjaytahu",
        "urdu": "اے میرے معبود! جیسا کہ تو نے جناب موسیٰؑ کے لیے سمندر کو شق کیا اور انہیں نجات دی،"
      },
      {
        "arabic": "أَسْأَلُكَ أَنْ تُصَلِّيَ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ، وَأَنْ تُنْجِيَنِي مِمَّا أَنَا فِيهِ،",
        "english": "I ask Thee that Thou mayest send blessings on Muhammad and his family, and that Thou mayest save me from that in which I am,",
        "transliteration": "as’aluka an tusalliya ‘ala muhammadin wa ali muhammadin, wa an tunjiyani mimma ana fihi",
        "urdu": "میں تجھ سے سوال کرتا ہوں کہ تو محمدؐ اور ان کی آل پر رحمت نازل فرما، اور مجھے اس پریشانی سے نجات دے جس میں میں (گھرا ہوا) ہوں،"
      },
      {
        "arabic": "وَتُفَرِّجَ عَنِّي فَرَجاً عَاجِلاً غَيْرَ آجِلٍ، بِفَضْلِكَ وَرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ.",
        "english": "and grant me relief, a relief speedy, not late, by Thy grace and Thy mercy, O most Merciful of those who show mercy!",
        "transliteration": "wa tufarrija ‘anni farajan ‘ajilan ghayra ajilin, bifadlika wa rahmatika ya arhamar-rahimin",
        "urdu": "اور مجھے جلد کشائش عطا فرما بغیر کسی تاخیر کے، اپنے فضل اور اپنی رحمت کے صدقے میں اے سب سے زیادہ رحم فرمانے والے۔"
      }
    ]
  },
  `;

const result = part1 + duaYamanEndingLines + part2;
fs.writeFileSync(filePath, result);
console.log('File fixed successfully');
