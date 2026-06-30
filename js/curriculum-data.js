/* =====================================================
   curriculum-data.js  —  Pre-defined chapters, Q&A
   for Classes 1–10, all major subjects
===================================================== */

const CURRICULUM_LIBRARY = {

  /* ══════════════════════════════════════════
     NURSERY (NUR)
  ══════════════════════════════════════════ */
  'NUR': {
    'English': [
      { chapter:'Alphabets A–Z', topics:['Letter recognition','Capital & small letters','Letter sounds','Writing practice'],
        short:[
          {q:'What comes after A?', a:'B'},
          {q:'Write the small letter of M.', a:'m'},
          {q:'What sound does the letter S make?', a:'S makes the "sss" sound'},
          {q:'How many letters are in the alphabet?', a:'26'},
          {q:'What comes before D?', a:'C'},
        ],
        long:[
          {q:'Write alphabets A to E and draw one picture for each.', a:'A-Apple, B-Ball, C-Cat, D-Dog, E-Elephant'},
          {q:'Write 3 capital letters and their small letters.', a:'A-a, B-b, C-c'},
          {q:'Name 3 animals whose names start with the letter B.', a:'Bear, Buffalo, Butterfly'},
          {q:'Draw and colour the letter A. What word starts with A?', a:'Apple starts with A'},
          {q:'Name 3 things in your classroom that start with different letters.', a:'Board (B), Chair (C), Door (D)'},
        ],
        mcq:[
          {q:'Which letter comes after C?', options:['A','B','D','E'], answer:'C'},
          {q:'How many vowels are in the English alphabet?', options:['3','4','5','6'], answer:'C'},
          {q:'Which is the last letter of the alphabet?', options:['X','Y','Z','W'], answer:'C'},
          {q:'Which letter does "Apple" start with?', options:['B','A','C','D'], answer:'B'},
          {q:'What is the small letter of B?', options:['d','p','b','q'], answer:'C'},
        ]
      },
      { chapter:'My Body', topics:['Head','Eyes','Nose','Mouth','Hands','Legs'],
        short:[
          {q:'How many eyes do you have?', a:'Two'},
          {q:'What do we use to smell?', a:'Nose'},
          {q:'What do we use to eat?', a:'Mouth'},
          {q:'How many fingers are on one hand?', a:'Five'},
          {q:'What do we use to see?', a:'Eyes'},
        ],
        long:[
          {q:'Name 5 parts of your body.', a:'Head, Eyes, Nose, Mouth, Hands'},
          {q:'What are ears used for?', a:'Ears are used for hearing sounds and music.'},
          {q:'Why should we wash our hands?', a:'We wash hands to remove germs and stay healthy.'},
          {q:'Name the body part used for each: seeing, hearing, smelling.', a:'Seeing-Eyes, Hearing-Ears, Smelling-Nose'},
          {q:'How many legs does a human have?', a:'Two legs. We use them to walk and run.'},
        ],
        mcq:[
          {q:'Which body part do we use to hear?', options:['Eyes','Nose','Ears','Mouth'], answer:'C'},
          {q:'How many hands do we have?', options:['One','Two','Three','Four'], answer:'B'},
          {q:'What do we smell with?', options:['Eyes','Ears','Mouth','Nose'], answer:'D'},
          {q:'Which body part helps us walk?', options:['Hands','Legs','Head','Ears'], answer:'B'},
          {q:'How many toes are on both feet together?', options:['5','8','10','12'], answer:'C'},
        ]
      },
      { chapter:'My Family', topics:['Mother','Father','Brother','Sister','Grandparents'],
        short:[
          {q:'Who is your mother?', a:'The woman who gave birth to me and takes care of me.'},
          {q:'Name the members of your family.', a:'Mother, Father, Brother, Sister, Grandparents'},
          {q:'Who is your father?', a:'My father is the man in the family who takes care of us.'},
          {q:'What does your mother do for you?', a:'She cooks food, keeps us clean and loves us.'},
          {q:'Who is older — your brother or your grandfather?', a:'Grandfather'},
        ],
        long:[
          {q:'Draw your family and name each person.', a:'Draw mother, father, sibling, self with name labels.'},
          {q:'What do you love about your family?', a:'My family loves me, takes care of me, feeds me and keeps me safe.'},
          {q:'How many people are in your family? Name them.', a:'(Student\'s own answer based on their family)'},
          {q:'What does your father do every day?', a:'My father goes to work, earns money, and spends time with family.'},
          {q:'Why is family important?', a:'Family is important because they love us, help us and keep us safe.'},
        ],
        mcq:[
          {q:'Who cooks food for you at home?', options:['Teacher','Mother','Friend','Doctor'], answer:'B'},
          {q:'What do you call your father\'s mother?', options:['Aunt','Sister','Grandmother','Mother'], answer:'C'},
          {q:'Who is your sibling if you have a brother?', options:['Father','Brother','Uncle','Cousin'], answer:'B'},
          {q:'How many parents do most children have?', options:['1','2','3','4'], answer:'B'},
          {q:'Who takes you to school?', options:['Friend','Mother or Father','Shopkeeper','Doctor'], answer:'B'},
        ]
      },
      { chapter:'Colours', topics:['Red','Blue','Green','Yellow','Orange','Purple','Black','White'],
        short:[
          {q:'What colour is the sky?', a:'Blue'},
          {q:'What colour is grass?', a:'Green'},
          {q:'Name 3 colours you know.', a:'Red, Blue, Yellow'},
          {q:'What colour is a banana?', a:'Yellow'},
          {q:'What colour is tomato?', a:'Red'},
        ],
        long:[
          {q:'Name 5 colours and give one example of each colour thing.', a:'Red-Apple, Blue-Sky, Green-Grass, Yellow-Banana, White-Milk'},
          {q:'What is your favourite colour? Draw something of that colour.', a:'(Student\'s own answer)'},
          {q:'What colours do you mix to make green?', a:'We mix Blue and Yellow to make Green.'},
          {q:'Name 3 things of blue colour in your classroom.', a:'(Student\'s own observation)'},
          {q:'What colours are in a rainbow? Name 5.', a:'Red, Orange, Yellow, Green, Blue, Indigo, Violet'},
        ],
        mcq:[
          {q:'What colour is an orange fruit?', options:['Blue','Green','Orange','Red'], answer:'C'},
          {q:'What colour is the sun?', options:['Blue','Yellow','Red','Green'], answer:'B'},
          {q:'What colour is milk?', options:['Black','White','Yellow','Green'], answer:'B'},
          {q:'Which colour is formed by mixing blue and yellow?', options:['Orange','Red','Green','Purple'], answer:'C'},
          {q:'What colour is coal?', options:['White','Blue','Black','Red'], answer:'C'},
        ]
      },
      { chapter:'Shapes', topics:['Circle','Square','Triangle','Rectangle','Star'],
        short:[
          {q:'How many sides does a triangle have?', a:'3'},
          {q:'How many sides does a square have?', a:'4'},
          {q:'Name a round shape.', a:'Circle'},
          {q:'How many corners does a rectangle have?', a:'4'},
          {q:'Which shape has no corners?', a:'Circle'},
        ],
        long:[
          {q:'Draw 4 different shapes and name them.', a:'Circle, Square, Triangle, Rectangle'},
          {q:'Name things around you that are round.', a:'Ball, Coin, Sun, Moon, Wheel'},
          {q:'What is the difference between a square and a rectangle?', a:'A square has all 4 sides equal. A rectangle has 2 long and 2 short sides.'},
          {q:'Name 2 things in your house that are in the shape of a rectangle.', a:'Door, Window, Book, Table'},
          {q:'How many sides does a star have?', a:'A star has 5 points (sides).'},
        ],
        mcq:[
          {q:'Which shape has 3 sides?', options:['Circle','Square','Triangle','Rectangle'], answer:'C'},
          {q:'How many sides does a square have?', options:['3','4','5','6'], answer:'B'},
          {q:'A wheel is in the shape of a?', options:['Square','Triangle','Circle','Rectangle'], answer:'C'},
          {q:'Which shape has 4 equal sides?', options:['Rectangle','Triangle','Square','Circle'], answer:'C'},
          {q:'A door is in the shape of a?', options:['Circle','Triangle','Rectangle','Star'], answer:'C'},
        ]
      },
    ],
    'Numbers': [
      { chapter:'Numbers 1–10', topics:['Counting','Writing numbers','One to Ten','Before and After'],
        short:[
          {q:'Count and write: ⭐⭐⭐', a:'3'},
          {q:'What comes after 5?', a:'6'},
          {q:'What comes before 4?', a:'3'},
          {q:'Write the number for "Seven".', a:'7'},
          {q:'How many fingers are on one hand?', a:'5'},
        ],
        long:[
          {q:'Write numbers 1 to 10 in words.', a:'One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten'},
          {q:'Count the stars ⭐⭐⭐⭐⭐ and write the number.', a:'5 stars'},
          {q:'Draw 7 apples and count them.', a:'Draw 7 apples and write 7'},
          {q:'Write numbers 1–5 and match with dots.', a:'1=•, 2=••, 3=•••, 4=••••, 5=•••••'},
          {q:'What comes after 8? What comes before 10?', a:'After 8 is 9. Before 10 is 9.'},
        ],
        mcq:[
          {q:'How many legs does a cat have?', options:['2','3','4','6'], answer:'C'},
          {q:'What comes after 6?', options:['5','7','8','4'], answer:'B'},
          {q:'Which number is the smallest?', options:['9','5','3','7'], answer:'C'},
          {q:'What is 2 + 2?', options:['3','4','5','6'], answer:'B'},
          {q:'How many toes do you have on both feet?', options:['5','8','10','12'], answer:'C'},
        ]
      },
    ],
    'GK': [
      { chapter:'Animals & Their Sounds', topics:['Pet animals','Wild animals','Farm animals','Sounds'],
        short:[
          {q:'What sound does a dog make?', a:'Woof / Bark'},
          {q:'What sound does a cat make?', a:'Meow'},
          {q:'Name 2 wild animals.', a:'Lion, Tiger'},
          {q:'What sound does a cow make?', a:'Moo'},
          {q:'Name 2 pet animals.', a:'Dog, Cat'},
        ],
        long:[
          {q:'Name 5 animals and the sounds they make.', a:'Dog-Bark, Cat-Meow, Cow-Moo, Lion-Roar, Bird-Tweet'},
          {q:'What is the difference between pet animals and wild animals?', a:'Pet animals live with us at home. Wild animals live in forests.'},
          {q:'Name 3 animals that give us milk.', a:'Cow, Buffalo, Goat'},
          {q:'What do we get from hens?', a:'We get eggs and meat from hens.'},
          {q:'Why should we be kind to animals?', a:'Animals are living beings. They feel pain. We should treat them gently.'},
        ],
        mcq:[
          {q:'What does a lion say?', options:['Moo','Roar','Bark','Meow'], answer:'B'},
          {q:'Which animal gives us milk?', options:['Dog','Cat','Cow','Parrot'], answer:'C'},
          {q:'Which is a pet animal?', options:['Tiger','Lion','Dog','Bear'], answer:'C'},
          {q:'Where do wild animals live?', options:['House','Forest','School','Farm'], answer:'B'},
          {q:'What do hens give us?', options:['Milk','Wool','Eggs','Honey'], answer:'C'},
        ]
      },
      { chapter:'Fruits & Vegetables', topics:['Common fruits','Common vegetables','Colours of fruits'],
        short:[
          {q:'Name 3 fruits you eat.', a:'Apple, Banana, Mango'},
          {q:'What colour is a mango?', a:'Yellow'},
          {q:'Name 2 vegetables.', a:'Potato, Tomato'},
          {q:'Which fruit is red and round?', a:'Apple'},
          {q:'Name a yellow fruit.', a:'Banana'},
        ],
        long:[
          {q:'Name 5 fruits and their colours.', a:'Apple-Red, Banana-Yellow, Mango-Yellow, Grape-Purple, Orange-Orange'},
          {q:'Name 5 vegetables we eat every day.', a:'Potato, Tomato, Onion, Carrot, Spinach'},
          {q:'Why should we eat fruits and vegetables?', a:'They are healthy, give us vitamins and make us strong.'},
          {q:'Which fruits do you like most? Draw them.', a:'(Student\'s own answer)'},
          {q:'Name 2 vegetables that grow underground.', a:'Potato, Carrot, Radish'},
        ],
        mcq:[
          {q:'Which is a fruit?', options:['Carrot','Potato','Apple','Onion'], answer:'C'},
          {q:'What colour is a ripe banana?', options:['Red','Green','Yellow','Blue'], answer:'C'},
          {q:'Which vegetable is orange in colour?', options:['Potato','Tomato','Carrot','Onion'], answer:'C'},
          {q:'Which fruit is called "king of fruits"?', options:['Apple','Banana','Mango','Orange'], answer:'C'},
          {q:'Which vegetable grows underground?', options:['Tomato','Cauliflower','Potato','Brinjal'], answer:'C'},
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     KINDERGARTEN (KG)
  ══════════════════════════════════════════ */
  'KG': {
    'English': [
      { chapter:'Words & Sentences', topics:['3-letter words','Simple sentences','My name','Days of the week'],
        short:[
          {q:'Write a 3-letter word for a pet animal.', a:'Cat / Dog'},
          {q:'What is your name?', a:'My name is _____.'},
          {q:'Write 2 days of the week.', a:'Monday, Tuesday'},
          {q:'Use "big" in a sentence.', a:'The elephant is big.'},
          {q:'How many days are in a week?', a:'7'},
        ],
        long:[
          {q:'Write the days of the week in order.', a:'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday'},
          {q:'Write 3 sentences about yourself.', a:'My name is ___. I am ___ years old. I go to ___ school.'},
          {q:'Write 5 three-letter words with pictures.', a:'Cat, Dog, Bat, Hen, Sun'},
          {q:'Make a sentence using the word "happy".', a:'I am happy today. / My mother is happy.'},
          {q:'Write 3 sentences about your school.', a:'My school is nice. My teacher is kind. I love my school.'},
        ],
        mcq:[
          {q:'How many days are in a week?', options:['5','6','7','8'], answer:'C'},
          {q:'Which day comes after Monday?', options:['Sunday','Wednesday','Tuesday','Friday'], answer:'C'},
          {q:'What is the first day of the week?', options:['Monday','Sunday','Saturday','Friday'], answer:'B'},
          {q:'A ___ word has 3 letters.', options:['Long','Short','Big','Two-letter'], answer:'B'},
          {q:'Which sentence is correct?', options:['I is happy','I am happy','I are happy','I were happy'], answer:'B'},
        ]
      },
      { chapter:'Rhymes & Stories', topics:['Nursery rhymes','Simple stories','Comprehension'],
        short:[
          {q:'Complete: "Twinkle twinkle little ___"', a:'star'},
          {q:'Who sat on a wall in the nursery rhyme?', a:'Humpty Dumpty'},
          {q:'What does Jack jump over in the nursery rhyme?', a:'The candlestick'},
          {q:'Name 2 nursery rhymes you know.', a:'Twinkle Twinkle, Jack and Jill'},
          {q:'Who went up the hill with Jack?', a:'Jill'},
        ],
        long:[
          {q:'Write the full rhyme "Jack and Jill".', a:'Jack and Jill went up the hill / To fetch a pail of water / Jack fell down and broke his crown / And Jill came tumbling after.'},
          {q:'Tell in your own words: what happened to Humpty Dumpty?', a:'Humpty Dumpty sat on a wall. He fell down and nobody could fix him.'},
          {q:'What is your favourite rhyme? Write 2 lines of it.', a:'(Student\'s own answer)'},
          {q:'Write 4 lines of "Twinkle Twinkle Little Star".', a:'Twinkle twinkle little star / How I wonder what you are / Up above the world so high / Like a diamond in the sky.'},
          {q:'What do you learn from nursery rhymes?', a:'We learn new words, sounds and it helps us speak English better.'},
        ],
        mcq:[
          {q:'Who fell off the wall in the nursery rhyme?', options:['Jack','Jill','Humpty Dumpty','Mary'], answer:'C'},
          {q:'In "Twinkle Twinkle" the star is compared to a?', options:['Moon','Diamond','Sun','Flower'], answer:'B'},
          {q:'Jack and Jill went up the hill to get?', options:['Flowers','Apples','Water','Stones'], answer:'C'},
          {q:'What did Jack break when he fell?', options:['His leg','His arm','His crown (head)','His back'], answer:'C'},
          {q:'Where does the star shine in "Twinkle Twinkle"?', options:['In the sea','On earth','Up above the world','In a tree'], answer:'C'},
        ]
      },
    ],
    'Math': [
      { chapter:'Numbers 1–20 & Simple Addition', topics:['Counting to 20','Addition within 10','Number before/after'],
        short:[
          {q:'What comes after 12?', a:'13'},
          {q:'3 + 4 = ?', a:'7'},
          {q:'What comes before 10?', a:'9'},
          {q:'2 + 5 = ?', a:'7'},
          {q:'Write 15 in words.', a:'Fifteen'},
        ],
        long:[
          {q:'Write numbers 11 to 20 in words.', a:'Eleven, Twelve, Thirteen, Fourteen, Fifteen, Sixteen, Seventeen, Eighteen, Nineteen, Twenty'},
          {q:'Solve: 4+3=?, 5+2=?, 6+1=?', a:'4+3=7, 5+2=7, 6+1=7'},
          {q:'A boy has 5 chocolates. He gets 3 more. How many total?', a:'5+3=8 chocolates'},
          {q:'Write numbers 1–20 and circle all even numbers.', a:'2,4,6,8,10,12,14,16,18,20 are even'},
          {q:'Count forward from 10 to 20.', a:'10,11,12,13,14,15,16,17,18,19,20'},
        ],
        mcq:[
          {q:'5 + 3 = ?', options:['7','8','9','6'], answer:'B'},
          {q:'What comes after 15?', options:['14','16','17','13'], answer:'B'},
          {q:'Which number is the largest?', options:['12','17','8','15'], answer:'B'},
          {q:'4 + 4 = ?', options:['6','7','8','9'], answer:'C'},
          {q:'How many months are in a year?', options:['10','11','12','13'], answer:'C'},
        ]
      },
      { chapter:'Shapes & Measurements', topics:['2D Shapes','Big-Small','Long-Short','Heavy-Light'],
        short:[
          {q:'Which is bigger — an elephant or a cat?', a:'Elephant'},
          {q:'Name a shape with 3 sides.', a:'Triangle'},
          {q:'Which is longer — a pencil or an eraser?', a:'Pencil'},
          {q:'A ball is which shape?', a:'Circle (sphere)'},
          {q:'Name 4 shapes.', a:'Circle, Square, Triangle, Rectangle'},
        ],
        long:[
          {q:'Explain the difference between big and small with 2 examples each.', a:'Big: elephant, house. Small: ant, eraser.'},
          {q:'Draw 4 shapes and name them. How many sides does each have?', a:'Circle-0, Square-4, Triangle-3, Rectangle-4'},
          {q:'Name 2 heavy things and 2 light things.', a:'Heavy: stone, book. Light: feather, paper.'},
          {q:'Draw a long thing and a short thing.', a:'(Student draws pencil-long, eraser-short)'},
          {q:'Is a door a rectangle or a square? Why?', a:'Rectangle. It has 2 long and 2 short sides, not all equal.'},
        ],
        mcq:[
          {q:'Which has 4 equal sides?', options:['Rectangle','Triangle','Circle','Square'], answer:'D'},
          {q:'Which is heavier?', options:['Paper','Stone','Feather','Leaf'], answer:'B'},
          {q:'Which is longer?', options:['Eraser','Pencil','Coin','Button'], answer:'B'},
          {q:'A pizza is in what shape?', options:['Square','Triangle','Circle','Rectangle'], answer:'C'},
          {q:'How many sides does a triangle have?', options:['2','3','4','5'], answer:'B'},
        ]
      },
    ],
    'GK': [
      { chapter:'My School', topics:['Classrooms','Teachers','Friends','School rules'],
        short:[
          {q:'Name 2 things you find in a classroom.', a:'Blackboard, Chalk / Desk, Chair'},
          {q:'Who teaches you in school?', a:'Teacher'},
          {q:'Name 2 school rules.', a:'Reach school on time. Listen to the teacher.'},
          {q:'What do you carry to school?', a:'School bag, books, tiffin box, water bottle'},
          {q:'What do you say when you enter class?', a:'Good morning Teacher / May I come in?'},
        ],
        long:[
          {q:'Write 5 things you have in your school bag.', a:'Books, copies, pencil, eraser, ruler, tiffin, water bottle'},
          {q:'What are good school habits?', a:'Come on time, listen to teacher, do homework, be kind to friends, keep classroom clean.'},
          {q:'Write 3 sentences about your school.', a:'My school is clean. My teacher is kind. I have many friends in school.'},
          {q:'Who are the important people in your school?', a:'Principal, teachers, peons, office staff, library teacher'},
          {q:'What do you learn in school?', a:'We learn to read, write, count, draw, sing and make friends.'},
        ],
        mcq:[
          {q:'Who teaches us in school?', options:['Doctor','Teacher','Shopkeeper','Driver'], answer:'B'},
          {q:'Where do you study?', options:['Hospital','Market','School','Farm'], answer:'C'},
          {q:'What do you write with on the blackboard?', options:['Pencil','Pen','Chalk','Crayon'], answer:'C'},
          {q:'What do you say when you meet your teacher?', options:['Bye','Good Morning','Thank you','Sorry'], answer:'B'},
          {q:'Who is the head of the school?', options:['Teacher','Peon','Principal','Cook'], answer:'C'},
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 1
  ══════════════════════════════════════════ */
  '1': {
    Math: [
      {
        chapter: 'Numbers 1–100',
        topics: ['Counting', 'Number names', 'Before/After numbers', 'Smallest & Largest'],
        qa: [
          { q: 'What comes after 9?', a: '10' },
          { q: 'Write the number name for 15.', a: 'Fifteen' },
          { q: 'Which is smaller: 7 or 3?', a: '3' },
          { q: 'Count and write: ★★★★★', a: '5' },
          { q: 'What comes before 20?', a: '19' },
        ]
      },
      {
        chapter: 'Addition',
        topics: ['Single digit addition', 'Addition with 0', 'Adding two-digit numbers'],
        qa: [
          { q: '3 + 4 = ?', a: '7' },
          { q: '5 + 0 = ?', a: '5' },
          { q: '6 + 6 = ?', a: '12' },
          { q: 'A boy has 4 apples and gets 3 more. How many in all?', a: '7 apples' },
          { q: '9 + 1 = ?', a: '10' },
        ]
      },
      {
        chapter: 'Subtraction',
        topics: ['Single digit subtraction', 'Subtraction with 0', 'Word problems'],
        qa: [
          { q: '8 − 3 = ?', a: '5' },
          { q: '7 − 0 = ?', a: '7' },
          { q: '10 − 5 = ?', a: '5' },
          { q: 'There are 6 birds. 2 fly away. How many are left?', a: '4 birds' },
          { q: '9 − 9 = ?', a: '0' },
        ]
      },
      {
        chapter: 'Shapes & Patterns',
        topics: ['Circle, Square, Triangle, Rectangle', 'Patterns', 'Symmetry'],
        qa: [
          { q: 'How many sides does a triangle have?', a: '3' },
          { q: 'Name the shape with no corners.', a: 'Circle' },
          { q: 'How many sides does a rectangle have?', a: '4' },
          { q: 'Complete the pattern: 1, 2, 1, 2, 1, __', a: '2' },
          { q: 'How many corners does a square have?', a: '4' },
        ]
      },
    ],
    English: [
      {
        chapter: 'Alphabet & Phonics',
        topics: ['Capital and small letters', 'Vowels and consonants', 'Word families'],
        qa: [
          { q: 'Name the 5 vowels.', a: 'A, E, I, O, U' },
          { q: 'Write the small letter of "B".', a: 'b' },
          { q: 'Which word starts with "A"? Apple / Mango', a: 'Apple' },
          { q: 'How many letters are in the alphabet?', a: '26' },
          { q: '"Cat" rhymes with which word: bat or sun?', a: 'bat' },
        ]
      },
      {
        chapter: 'Simple Words & Sentences',
        topics: ['Three-letter words', 'Action words', 'Simple sentences'],
        qa: [
          { q: 'Complete: The cat ___ on the mat. (sit/sits)', a: 'sits' },
          { q: 'Write a simple sentence using "ball".', a: 'I have a ball. (accept any correct sentence)' },
          { q: 'What is the opposite of "big"?', a: 'small' },
          { q: 'Name one action word (verb).', a: 'run / jump / eat (any correct verb)' },
          { q: 'Fill in: This is ___ apple. (a / an)', a: 'an' },
        ]
      },
    ],
    Hindi: [
      {
        chapter: 'स्वर और व्यंजन',
        topics: ['अ से अः (स्वर)', 'क से ज्ञ (व्यंजन)', 'मात्राएँ'],
        qa: [
          { q: 'हिंदी वर्णमाला में कितने स्वर होते हैं?', a: '11 स्वर (अ, आ, इ, ई, उ, ऊ, ए, ऐ, ओ, औ, अं)' },
          { q: '"क" से शुरू होने वाला एक शब्द लिखो।', a: 'कमल, कप, कबूतर (कोई भी सही शब्द)' },
          { q: 'आ की मात्रा लगाकर शब्द बनाओ: म + ा = ?', a: 'मा (माँ, माल आदि)' },
          { q: '"बिल्ली" में कितने अक्षर हैं?', a: '3 (बि, ल्, ली)' },
          { q: 'विपरीत शब्द: दिन का विपरीत क्या है?', a: 'रात' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'My Family',
        topics: ['Family members', 'Roles in family', 'Near and dear ones'],
        qa: [
          { q: 'Who is the head of a family?', a: 'Father / Mother / Grandparent (accept all)' },
          { q: 'Name two members of a family.', a: 'Mother and Father / Brother and Sister (any two)' },
          { q: 'What do we call your mother\'s mother?', a: 'Grandmother (Nani / Dadi)' },
          { q: 'How should we treat our family members?', a: 'With love and respect' },
        ]
      },
      {
        chapter: 'My School',
        topics: ['Rooms in school', 'School helpers', 'School rules'],
        qa: [
          { q: 'Name two helpers in your school.', a: 'Teacher and Peon / Librarian (any two)' },
          { q: 'Where do we play in school?', a: 'Playground' },
          { q: 'Name one rule of your school.', a: 'Come on time / Wear uniform (any valid rule)' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 2
  ══════════════════════════════════════════ */
  '2': {
    Math: [
      {
        chapter: 'Numbers up to 1000',
        topics: ['3-digit numbers', 'Place value: hundreds, tens, ones', 'Expanded form'],
        qa: [
          { q: 'What is the place value of 4 in 346?', a: 'Tens (40)' },
          { q: 'Write 253 in expanded form.', a: '200 + 50 + 3' },
          { q: 'What comes after 299?', a: '300' },
          { q: 'Write the greatest 3-digit number.', a: '999' },
          { q: 'Write the smallest 3-digit number.', a: '100' },
        ]
      },
      {
        chapter: 'Addition & Subtraction (2-digit)',
        topics: ['Carrying', 'Borrowing', 'Word problems'],
        qa: [
          { q: '47 + 36 = ?', a: '83' },
          { q: '82 − 45 = ?', a: '37' },
          { q: 'Sum of 55 and 25?', a: '80' },
          { q: 'Difference of 90 and 36?', a: '54' },
          { q: 'A shop has 65 pens. 28 are sold. How many are left?', a: '37 pens' },
        ]
      },
      {
        chapter: 'Multiplication (Tables 1–5)',
        topics: ['Concept of multiplication', 'Times tables 1–5', 'Repeated addition'],
        qa: [
          { q: '4 × 3 = ?', a: '12' },
          { q: '5 × 5 = ?', a: '25' },
          { q: '3 × 0 = ?', a: '0' },
          { q: 'Write 2 × 4 as repeated addition.', a: '2 + 2 + 2 + 2 = 8' },
          { q: '4 baskets, 5 fruits each. Total fruits?', a: '20 fruits' },
        ]
      },
    ],
    English: [
      {
        chapter: 'Nouns & Pronouns',
        topics: ['Common and proper nouns', 'He, She, It, They, We'],
        qa: [
          { q: 'Is "Delhi" a common or proper noun?', a: 'Proper noun' },
          { q: 'Replace with pronoun: "Ram and Sita are friends."', a: 'They are friends.' },
          { q: 'What pronoun do we use for a girl?', a: 'She' },
          { q: 'Give one example of a proper noun.', a: 'India / Ravi / Taj Mahal (any valid)' },
          { q: '"Dog" is a _____ noun. (common/proper)', a: 'Common noun' },
        ]
      },
      {
        chapter: 'Adjectives',
        topics: ['Describing words', 'Adjectives of quality, quantity, number'],
        qa: [
          { q: 'Underline the adjective: "She has a red bag."', a: 'red' },
          { q: 'Give an adjective for an elephant.', a: 'big / huge / grey (any valid)' },
          { q: 'Fill in: I have ___ mangoes. (few/many — use any)', a: 'few / many (both acceptable)' },
          { q: 'What is the adjective in "two birds"?', a: 'two (adjective of number)' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Plants Around Us',
        topics: ['Parts of a plant', 'Types of plants (herbs, shrubs, trees)', 'Uses of plants'],
        qa: [
          { q: 'Name the parts of a plant.', a: 'Root, Stem, Leaf, Flower, Fruit, Seed' },
          { q: 'Which part of the plant makes food?', a: 'Leaves (by photosynthesis)' },
          { q: 'Give an example of a herb.', a: 'Tulsi / Mint / Coriander' },
          { q: 'What do roots do?', a: 'Absorb water and minerals; hold the plant in the soil' },
          { q: 'Give one use of plants.', a: 'Food / Medicine / Wood / Oxygen (any valid)' },
        ]
      },
      {
        chapter: 'Animals Around Us',
        topics: ['Domestic and wild animals', 'Animals and their young ones', 'Animal homes'],
        qa: [
          { q: 'Name two domestic animals.', a: 'Cow, Dog (any two valid domestic animals)' },
          { q: 'What is the young one of a dog called?', a: 'Puppy' },
          { q: 'Where do birds live?', a: 'Nest' },
          { q: 'Name a wild animal.', a: 'Lion / Tiger / Elephant (any wild animal)' },
          { q: 'What do we call a place where cows are kept?', a: 'Shed / Cowshed' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 3
  ══════════════════════════════════════════ */
  '3': {
    Math: [
      {
        chapter: 'Numbers up to 10,000',
        topics: ['4-digit numbers', 'Place value', 'Comparison', 'Roman numerals'],
        qa: [
          { q: 'What is the place value of 6 in 4,632?', a: 'Hundreds (600)' },
          { q: 'Write 3,405 in words.', a: 'Three thousand four hundred and five' },
          { q: 'Write X + V in numerals.', a: '15' },
          { q: 'Write 14 in Roman numerals.', a: 'XIV' },
          { q: 'Arrange in ascending order: 2341, 1234, 4321, 3412', a: '1234, 2341, 3412, 4321' },
        ]
      },
      {
        chapter: 'Fractions',
        topics: ['Half, quarter, three-quarters', 'Numerator and denominator', 'Equal fractions'],
        qa: [
          { q: 'What is the numerator in 3/5?', a: '3' },
          { q: 'Write one-half as a fraction.', a: '1/2' },
          { q: 'If a pizza is cut into 4 equal pieces, what fraction is one piece?', a: '1/4' },
          { q: 'Which is greater: 1/2 or 1/4?', a: '1/2' },
          { q: 'What is 3/4 in words?', a: 'Three-quarters' },
        ]
      },
      {
        chapter: 'Multiplication & Division (Tables 1–10)',
        topics: ['Tables 6–10', 'Division as sharing', 'Relationship between × and ÷'],
        qa: [
          { q: '7 × 8 = ?', a: '56' },
          { q: '9 × 6 = ?', a: '54' },
          { q: '48 ÷ 6 = ?', a: '8' },
          { q: '63 ÷ 7 = ?', a: '9' },
          { q: 'If 5 × ___ = 45, find the missing number.', a: '9' },
        ]
      },
    ],
    English: [
      {
        chapter: 'Tenses (Present, Past, Future)',
        topics: ['Simple present', 'Simple past (-ed)', 'Simple future (will)'],
        qa: [
          { q: 'Change to past tense: "She plays football."', a: 'She played football.' },
          { q: 'Change to future tense: "He eats lunch."', a: 'He will eat lunch.' },
          { q: 'Is this present or past? "They walked to school."', a: 'Past' },
          { q: 'Fill in (simple present): She ___ English. (teach/teaches)', a: 'teaches' },
          { q: 'Write one sentence in simple future.', a: 'I will go to school tomorrow. (any valid sentence)' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Food and Nutrition',
        topics: ['Food groups', 'Balanced diet', 'Nutrients: carbohydrates, proteins, fats, vitamins, minerals'],
        qa: [
          { q: 'Name the five nutrients.', a: 'Carbohydrates, Proteins, Fats, Vitamins, Minerals' },
          { q: 'Which nutrient gives us energy?', a: 'Carbohydrates' },
          { q: 'Name a food rich in protein.', a: 'Egg / Pulses / Milk / Fish (any one)' },
          { q: 'What is a balanced diet?', a: 'A diet containing all nutrients in right proportion' },
          { q: 'Which vitamin do we get from sunlight?', a: 'Vitamin D' },
        ]
      },
      {
        chapter: 'Water',
        topics: ['Uses of water', 'Sources of water', 'Water cycle', 'Conservation'],
        qa: [
          { q: 'Name two sources of water.', a: 'River, Rain / Well, Pond (any two valid sources)' },
          { q: 'What are the three states of water?', a: 'Solid (ice), Liquid (water), Gas (steam)' },
          { q: 'What is the process of water going from earth to clouds called?', a: 'Evaporation (part of water cycle)' },
          { q: 'Name one way to conserve water.', a: 'Turn off the tap / Rainwater harvesting (any valid method)' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'Our Earth',
        topics: ['Globe and map', 'Continents and oceans', 'Directions (N, S, E, W)'],
        qa: [
          { q: 'How many continents are there?', a: '7' },
          { q: 'Name the largest continent.', a: 'Asia' },
          { q: 'How many oceans are there?', a: '5' },
          { q: 'Name the largest ocean.', a: 'Pacific Ocean' },
          { q: 'What is a globe?', a: 'A spherical model of the Earth' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 4
  ══════════════════════════════════════════ */
  '4': {
    Math: [
      {
        chapter: 'Large Numbers & Operations',
        topics: ['Numbers up to 1,00,000', 'Addition, Subtraction with large numbers', 'Estimation and rounding'],
        qa: [
          { q: 'Write 56,732 in words.', a: 'Fifty-six thousand seven hundred and thirty-two' },
          { q: 'Round 4,867 to the nearest hundred.', a: '4,900' },
          { q: '23,456 + 14,321 = ?', a: '37,777' },
          { q: '50,000 − 18,432 = ?', a: '31,568' },
          { q: 'What is the predecessor of 10,000?', a: '9,999' },
        ]
      },
      {
        chapter: 'Factors & Multiples',
        topics: ['Factors of a number', 'Multiples', 'Prime and composite numbers', 'HCF & LCM (intro)'],
        qa: [
          { q: 'List all factors of 12.', a: '1, 2, 3, 4, 6, 12' },
          { q: 'Is 7 a prime number? Why?', a: 'Yes, 7 has only two factors: 1 and 7' },
          { q: 'Write the first 5 multiples of 6.', a: '6, 12, 18, 24, 30' },
          { q: 'Is 9 prime or composite?', a: 'Composite (factors: 1, 3, 9)' },
          { q: 'HCF of 8 and 12?', a: '4' },
        ]
      },
    ],
    English: [
      {
        chapter: 'Parts of Speech',
        topics: ['Noun, Pronoun, Adjective, Verb, Adverb, Preposition, Conjunction, Interjection'],
        qa: [
          { q: 'Identify the verb: "She runs fast."', a: 'runs' },
          { q: 'Identify the adverb: "He spoke loudly."', a: 'loudly' },
          { q: 'What type of word is "under" in "The cat sat under the table"?', a: 'Preposition' },
          { q: 'Give an example of a conjunction.', a: 'and / but / or / because (any valid)' },
          { q: 'Name all 8 parts of speech.', a: 'Noun, Pronoun, Adjective, Verb, Adverb, Preposition, Conjunction, Interjection' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'The Human Body',
        topics: ['Major organs', 'Skeletal system', 'Digestive system', 'Respiratory system'],
        qa: [
          { q: 'Which organ pumps blood?', a: 'Heart' },
          { q: 'How many bones are in the adult human body?', a: '206' },
          { q: 'Where does digestion begin?', a: 'Mouth' },
          { q: 'What do lungs do?', a: 'Help us breathe; exchange oxygen and carbon dioxide' },
          { q: 'Name the largest organ of the body.', a: 'Skin' },
        ]
      },
      {
        chapter: 'States of Matter',
        topics: ['Solid, Liquid, Gas', 'Properties of each state', 'Changes of state'],
        qa: [
          { q: 'Give one example each of solid, liquid, and gas.', a: 'Solid: stone; Liquid: water; Gas: oxygen' },
          { q: 'What happens when ice is heated?', a: 'It melts into water' },
          { q: 'What is condensation?', a: 'Gas changing to liquid when cooled' },
          { q: 'Which state of matter has no definite shape?', a: 'Gas (and Liquid)' },
          { q: 'What is evaporation?', a: 'Liquid changing to gas' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 5
  ══════════════════════════════════════════ */
  '5': {
    Math: [
      {
        chapter: 'Fractions & Decimals',
        topics: ['Operations on fractions', 'Converting fractions to decimals', 'Comparing decimals'],
        qa: [
          { q: '2/3 + 1/3 = ?', a: '3/3 = 1' },
          { q: '3/4 − 1/4 = ?', a: '2/4 = 1/2' },
          { q: 'Convert 3/5 to decimal.', a: '0.6' },
          { q: 'Which is greater: 0.7 or 0.65?', a: '0.7' },
          { q: '1/2 × 4 = ?', a: '2' },
        ]
      },
      {
        chapter: 'Percentage',
        topics: ['Percent concept', 'Fraction/decimal to percent', 'Finding percentage of a number'],
        qa: [
          { q: 'What is 25% of 200?', a: '50' },
          { q: 'Express 1/4 as a percentage.', a: '25%' },
          { q: 'A student scored 80 out of 100. What percentage is this?', a: '80%' },
          { q: 'Express 0.5 as percentage.', a: '50%' },
          { q: 'What is 10% of 500?', a: '50' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Photosynthesis',
        topics: ['Process of photosynthesis', 'Sunlight, water, CO2, chlorophyll', 'Importance of photosynthesis'],
        qa: [
          { q: 'What is photosynthesis?', a: 'The process by which plants make their own food using sunlight, water, and CO2' },
          { q: 'What is the green pigment in leaves called?', a: 'Chlorophyll' },
          { q: 'What gas is released during photosynthesis?', a: 'Oxygen' },
          { q: 'Where does photosynthesis occur in a plant?', a: 'In the leaves (in chloroplasts)' },
          { q: 'What are the raw materials for photosynthesis?', a: 'Carbon dioxide, Water, and Sunlight' },
        ]
      },
      {
        chapter: 'Simple Machines',
        topics: ['Lever, Pulley, Inclined plane, Wheel and axle', 'Types of levers'],
        qa: [
          { q: 'Name the six types of simple machines.', a: 'Lever, Pulley, Inclined plane, Wheel & Axle, Screw, Wedge' },
          { q: 'Give an example of a lever.', a: 'Seesaw / Scissors / Crowbar' },
          { q: 'A ramp is an example of which simple machine?', a: 'Inclined plane' },
          { q: 'What does a pulley do?', a: 'Changes the direction of force and makes lifting easier' },
          { q: 'Is a screw a simple machine?', a: 'Yes, a screw is a type of inclined plane wrapped around a cylinder' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'India — Our Country',
        topics: ['States and capitals', 'Rivers', 'Mountains', 'National symbols'],
        qa: [
          { q: 'What is the capital of India?', a: 'New Delhi' },
          { q: 'Name the national animal of India.', a: 'Bengal Tiger' },
          { q: 'Which is the longest river in India?', a: 'Ganga (Ganges)' },
          { q: 'Name the highest mountain range in India.', a: 'The Himalayas' },
          { q: 'What is the national flower of India?', a: 'Lotus' },
        ]
      },
    ],
    Computer: [
      {
        chapter: 'Introduction to Computers',
        topics: ['What is a computer', 'Parts of a computer', 'Input and output devices', 'Uses of computers'],
        qa: [
          { q: 'What is a computer?', a: 'An electronic device that processes data and gives information' },
          { q: 'Name two input devices.', a: 'Keyboard and Mouse' },
          { q: 'Name two output devices.', a: 'Monitor and Printer' },
          { q: 'Full form of CPU.', a: 'Central Processing Unit' },
          { q: 'Give two uses of a computer.', a: 'Education, Office work, Communication, Entertainment (any two)' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 6
  ══════════════════════════════════════════ */
  '6': {
    Math: [
      {
        chapter: 'Integers',
        topics: ['Positive and negative integers', 'Number line', 'Addition and subtraction of integers'],
        qa: [
          { q: 'What is the additive inverse of −7?', a: '+7' },
          { q: '(−5) + (−3) = ?', a: '−8' },
          { q: '(−8) − (−3) = ?', a: '−5' },
          { q: 'Which is greater: −2 or −9?', a: '−2' },
          { q: 'Represent −4 on a number line description.', a: '4 units to the left of 0' },
        ]
      },
      {
        chapter: 'Ratio & Proportion',
        topics: ['Ratio', 'Proportion', 'Unitary method'],
        qa: [
          { q: 'Express 15:25 in simplest form.', a: '3:5' },
          { q: 'If 3 pens cost ₹12, what will 5 pens cost?', a: '₹20' },
          { q: 'Are 2:4 and 3:6 in proportion?', a: 'Yes, both equal 1:2' },
          { q: 'Find the missing term: 4:12 = ?:24', a: '8' },
          { q: 'What is a ratio?', a: 'Comparison of two quantities of same kind' },
        ]
      },
      {
        chapter: 'Basic Geometry',
        topics: ['Lines, angles, triangles', 'Types of angles', 'Properties of triangles'],
        qa: [
          { q: 'What is an acute angle?', a: 'An angle less than 90°' },
          { q: 'What is a right angle?', a: 'An angle equal to 90°' },
          { q: 'Sum of angles in a triangle?', a: '180°' },
          { q: 'What is a scalene triangle?', a: 'A triangle with all three sides of different lengths' },
          { q: 'Define parallel lines.', a: 'Lines that never meet and are always the same distance apart' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Cell — Basic Unit of Life',
        topics: ['Cell structure', 'Plant vs Animal cell', 'Unicellular and multicellular organisms'],
        qa: [
          { q: 'Who discovered the cell?', a: 'Robert Hooke (1665)' },
          { q: 'What is the control centre of a cell?', a: 'Nucleus' },
          { q: 'Name a part present in plant cell but not in animal cell.', a: 'Cell wall / Chloroplast / Large vacuole' },
          { q: 'What is a unicellular organism? Give example.', a: 'An organism made of one cell; e.g., Amoeba, Bacteria' },
          { q: 'What does a mitochondria do?', a: 'Produces energy (powerhouse of the cell)' },
        ]
      },
      {
        chapter: 'Electricity',
        topics: ['Electric circuit', 'Conductors and insulators', 'Series and parallel circuits'],
        qa: [
          { q: 'What is an electric circuit?', a: 'A closed path through which electric current flows' },
          { q: 'Give two examples of conductors.', a: 'Copper, Iron, Silver (any two metals)' },
          { q: 'Give two examples of insulators.', a: 'Rubber, Wood, Plastic (any two)' },
          { q: 'What device is used to switch a circuit on/off?', a: 'Switch' },
          { q: 'In which circuit does current have only one path?', a: 'Series circuit' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'Ancient India',
        topics: ['Indus Valley Civilization', 'Vedic period', 'Mauryan Empire'],
        qa: [
          { q: 'Name two cities of the Indus Valley Civilization.', a: 'Mohenjodaro and Harappa' },
          { q: 'Who founded the Mauryan Empire?', a: 'Chandragupta Maurya' },
          { q: 'Which emperor promoted Buddhism throughout the world?', a: 'Ashoka (Ashoka the Great)' },
          { q: 'What is the significance of the Vedas?', a: 'The oldest scriptures of Hinduism / ancient Indian texts with hymns and knowledge' },
          { q: 'What was the main feature of Indus Valley cities?', a: 'Well-planned cities with drainage systems, brick houses' },
        ]
      },
    ],
    Computer: [
      {
        chapter: 'MS Word Basics',
        topics: ['Creating and saving documents', 'Formatting text', 'Insert menu', 'Print'],
        qa: [
          { q: 'What is the shortcut to save a file?', a: 'Ctrl + S' },
          { q: 'What is the shortcut to copy selected text?', a: 'Ctrl + C' },
          { q: 'What is the shortcut for Undo?', a: 'Ctrl + Z' },
          { q: 'What does Ctrl + B do?', a: 'Makes text Bold' },
          { q: 'Name the default file extension for MS Word.', a: '.docx' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 7
  ══════════════════════════════════════════ */
  '7': {
    Math: [
      {
        chapter: 'Algebraic Expressions',
        topics: ['Terms, coefficients, variables', 'Like and unlike terms', 'Addition and subtraction of expressions'],
        qa: [
          { q: 'What is a variable?', a: 'A symbol (like x, y) representing an unknown quantity' },
          { q: 'Identify the coefficient in 5x²:', a: '5' },
          { q: 'Simplify: 3x + 2x', a: '5x' },
          { q: 'Simplify: 4a + 3b − 2a + b', a: '2a + 4b' },
          { q: 'Are 3x and 3y like or unlike terms?', a: 'Unlike terms (different variables)' },
        ]
      },
      {
        chapter: 'Linear Equations in One Variable',
        topics: ['Solving simple equations', 'Transposing', 'Word problems'],
        qa: [
          { q: 'Solve: x + 5 = 12', a: 'x = 7' },
          { q: 'Solve: 3x = 21', a: 'x = 7' },
          { q: 'Solve: 2x − 3 = 7', a: 'x = 5' },
          { q: 'The sum of a number and 8 is 20. Find the number.', a: 'x + 8 = 20 → x = 12' },
          { q: 'Solve: x/4 = 3', a: 'x = 12' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Nutrition in Plants and Animals',
        topics: ['Autotrophs and heterotrophs', 'Modes of nutrition', 'Digestive system in humans'],
        qa: [
          { q: 'What is an autotroph?', a: 'An organism that makes its own food (e.g., plants)' },
          { q: 'What is a heterotroph?', a: 'An organism that obtains food from other organisms (e.g., animals)' },
          { q: 'Name the enzyme in saliva.', a: 'Salivary Amylase (Ptyalin)' },
          { q: 'Where is bile produced?', a: 'Liver' },
          { q: 'What is the role of the small intestine?', a: 'Absorption of digested food into the bloodstream' },
        ]
      },
      {
        chapter: 'Heat and Temperature',
        topics: ['Conduction, convection, radiation', 'Thermometer', 'Expansion and contraction'],
        qa: [
          { q: 'What is conduction?', a: 'Transfer of heat through a solid material' },
          { q: 'What is convection?', a: 'Transfer of heat through liquids and gases' },
          { q: 'Give an example of radiation.', a: 'Heat from the sun reaching Earth' },
          { q: 'What does a clinical thermometer measure?', a: 'Human body temperature' },
          { q: 'Normal human body temperature in °C?', a: '37°C (98.6°F)' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'Medieval India',
        topics: ['Delhi Sultanate', 'Mughal Empire', 'Bhakti and Sufi movements'],
        qa: [
          { q: 'Who founded the Mughal Empire in India?', a: 'Babur (in 1526)' },
          { q: 'Name the greatest Mughal emperor.', a: 'Akbar (Akbar the Great)' },
          { q: 'Who built the Taj Mahal?', a: 'Shah Jahan' },
          { q: 'What was the Bhakti movement?', a: 'A Hindu religious reform movement emphasizing devotion to God' },
          { q: 'Name a famous saint of the Bhakti movement.', a: 'Kabir / Mirabai / Tukaram / Ramananda (any one)' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 8
  ══════════════════════════════════════════ */
  '8': {
    Math: [
      {
        chapter: 'Squares and Square Roots',
        topics: ['Perfect squares', 'Finding square roots by prime factorisation', 'Pythagorean triplets'],
        qa: [
          { q: 'What is 12²?', a: '144' },
          { q: 'Find √196.', a: '14' },
          { q: 'Is 81 a perfect square? Find its square root.', a: 'Yes, √81 = 9' },
          { q: 'Find the square root of 256 by prime factorisation.', a: '256 = 2⁸, √256 = 2⁴ = 16' },
          { q: 'Write a Pythagorean triplet with 6.', a: '6, 8, 10 (since 36+64=100)' },
        ]
      },
      {
        chapter: 'Cubes and Cube Roots',
        topics: ['Perfect cubes', 'Cube roots by prime factorisation'],
        qa: [
          { q: 'What is 5³?', a: '125' },
          { q: 'Find the cube root of 216.', a: '6' },
          { q: 'Is 343 a perfect cube?', a: 'Yes, 343 = 7³' },
          { q: 'Find ∛512.', a: '8' },
          { q: 'What is 10³?', a: '1000' },
        ]
      },
      {
        chapter: 'Mensuration',
        topics: ['Area and perimeter of plane figures', 'Surface area and volume of cuboid and cube'],
        qa: [
          { q: 'Area formula for a triangle?', a: '(1/2) × base × height' },
          { q: 'Volume formula for a cuboid?', a: 'l × b × h' },
          { q: 'Find the area of a circle with radius 7 cm. (π = 22/7)', a: '154 cm²' },
          { q: 'Total surface area of a cube with side 5 cm?', a: '6 × 5² = 150 cm²' },
          { q: 'Perimeter of a rectangle with l=8, b=5?', a: '2(8+5) = 26 units' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Microorganisms',
        topics: ['Types: bacteria, virus, fungi, protozoa', 'Useful and harmful microorganisms', 'Food preservation'],
        qa: [
          { q: 'Name four types of microorganisms.', a: 'Bacteria, Virus, Fungi, Protozoa' },
          { q: 'Give one beneficial use of bacteria.', a: 'Making curd / nitrogen fixation / decomposition (any one)' },
          { q: 'Which microorganism causes malaria?', a: 'Plasmodium (a protozoan), spread by Anopheles mosquito' },
          { q: 'Name one method of food preservation.', a: 'Pasteurisation / Adding salt or sugar / Refrigeration (any one)' },
          { q: 'Who invented the vaccine for smallpox?', a: 'Edward Jenner' },
        ]
      },
      {
        chapter: 'Metals and Non-Metals',
        topics: ['Properties of metals and non-metals', 'Reactivity series', 'Uses'],
        qa: [
          { q: 'Name one property of metals.', a: 'Good conductor of electricity / Ductile / Malleable / Lustrous (any one)' },
          { q: 'Is mercury a metal or non-metal?', a: 'Metal (liquid metal at room temperature)' },
          { q: 'Name one non-metal used in pencils.', a: 'Graphite (Carbon)' },
          { q: 'Which metal is the best conductor of electricity?', a: 'Silver' },
          { q: 'Name the non-metal essential for respiration.', a: 'Oxygen' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'Modern India — British Rule',
        topics: ['Arrival of Europeans', 'British East India Company', '1857 Revolt', 'Reform movements'],
        qa: [
          { q: 'When did the British East India Company arrive in India?', a: '1600 AD' },
          { q: 'What is the 1857 revolt also called?', a: 'The First War of Independence / Sepoy Mutiny' },
          { q: 'Who was the first Governor-General of India?', a: 'Warren Hastings' },
          { q: 'Who started the Young Bengal Movement?', a: 'Henry Louis Vivian Derozio' },
          { q: 'When was the Indian National Congress founded?', a: '1885' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 9
  ══════════════════════════════════════════ */
  '9': {
    Math: [
      {
        chapter: 'Number Systems',
        topics: ['Natural, whole, integer, rational, irrational, real numbers', 'Decimal expansions', 'Surds'],
        qa: [
          { q: 'Is √2 rational or irrational?', a: 'Irrational (non-terminating, non-repeating decimal)' },
          { q: 'Express 0.333... as a fraction.', a: '1/3' },
          { q: 'Simplify: √75', a: '5√3' },
          { q: 'Name a number that is whole but not natural.', a: '0' },
          { q: 'Between which two integers does √10 lie?', a: '3 and 4 (since √9=3 and √16=4)' },
        ]
      },
      {
        chapter: 'Polynomials',
        topics: ['Definition', 'Degree', 'Zeroes', 'Remainder & Factor theorems', 'Algebraic identities'],
        qa: [
          { q: 'What is the degree of 3x³ + 2x − 5?', a: '3' },
          { q: 'State the Remainder Theorem.', a: 'If p(x) is divided by (x−a), remainder = p(a)' },
          { q: 'Expand (a + b)² using identity.', a: 'a² + 2ab + b²' },
          { q: 'Factorise: x² − 9', a: '(x+3)(x−3)' },
          { q: 'Find the zero of p(x) = 2x + 4', a: 'x = −2' },
        ]
      },
      {
        chapter: 'Triangles (Congruence)',
        topics: ['SAS, ASA, SSS, RHS congruence rules', 'Properties of triangles', 'Inequalities in a triangle'],
        qa: [
          { q: 'State SSS congruence rule.', a: 'If three sides of one triangle equal three sides of another, triangles are congruent' },
          { q: 'In a right triangle, the longest side is called?', a: 'Hypotenuse' },
          { q: 'State the SAS congruence rule.', a: 'Two sides and the included angle of one triangle equal those of another' },
          { q: 'Can a triangle have sides 2, 3, and 6?', a: 'No (2+3 = 5 < 6, violates triangle inequality)' },
          { q: 'What is the angle sum property of a triangle?', a: 'Sum of all three angles = 180°' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Matter in Our Surroundings',
        topics: ['Physical states of matter', 'Evaporation', 'Latent heat', 'Plasma and Bose-Einstein condensate'],
        qa: [
          { q: 'Define matter.', a: 'Anything that has mass and occupies space' },
          { q: 'What is latent heat of fusion?', a: 'Heat required to change 1 kg of solid to liquid at its melting point without change in temperature' },
          { q: 'What is sublimation? Give an example.', a: 'Direct conversion of solid to gas; e.g., camphor, dry ice (CO₂)' },
          { q: 'What is plasma?', a: 'The fourth state of matter; super-energetic ionised gas (e.g., stars, lightning)' },
          { q: 'Why does evaporation cause cooling?', a: 'Evaporating particles take energy from the surface, lowering its temperature' },
        ]
      },
      {
        chapter: 'Atoms and Molecules',
        topics: ['Dalton\'s atomic theory', 'Atomic mass', 'Molecules', 'Mole concept'],
        qa: [
          { q: 'What is an atom?', a: 'The smallest unit of an element that retains its chemical properties' },
          { q: 'Atomic mass of Oxygen?', a: '16 u' },
          { q: 'What is a mole?', a: '6.022 × 10²³ particles (Avogadro\'s number)' },
          { q: 'What is the molecular formula of water?', a: 'H₂O' },
          { q: 'Who proposed the atomic theory?', a: 'John Dalton (1808)' },
        ]
      },
      {
        chapter: 'Force and Laws of Motion',
        topics: ['Newton\'s 3 laws', 'Inertia', 'Momentum', 'Conservation of momentum'],
        qa: [
          { q: 'State Newton\'s First Law of Motion.', a: 'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force' },
          { q: 'State Newton\'s Second Law of Motion.', a: 'F = ma (Force = mass × acceleration)' },
          { q: 'State Newton\'s Third Law of Motion.', a: 'For every action, there is an equal and opposite reaction' },
          { q: 'What is inertia?', a: 'The tendency of an object to resist a change in its state of motion' },
          { q: 'Define momentum.', a: 'Momentum = mass × velocity (p = mv)' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'French Revolution',
        topics: ['Causes', 'Major events', 'Declaration of Rights of Man', 'Napoleon'],
        qa: [
          { q: 'When did the French Revolution begin?', a: '1789' },
          { q: 'What was the slogan of the French Revolution?', a: 'Liberty, Equality, Fraternity' },
          { q: 'What was the Bastille?', a: 'A prison in Paris stormed on 14 July 1789, symbolising the start of the revolution' },
          { q: 'Who came to power after the French Revolution?', a: 'Napoleon Bonaparte' },
          { q: 'What were the three estates in French society?', a: 'First (Clergy), Second (Nobility), Third (Common people)' },
        ]
      },
    ],
  },

  /* ══════════════════════════════════════════
     CLASS 10
  ══════════════════════════════════════════ */
  '10': {
    Math: [
      {
        chapter: 'Real Numbers',
        topics: ['Euclid\'s Division Lemma', 'Fundamental Theorem of Arithmetic', 'Irrational numbers proof', 'Decimal expansions'],
        qa: [
          { q: 'State Euclid\'s Division Lemma.', a: 'For any two positive integers a and b: a = bq + r, where 0 ≤ r < b' },
          { q: 'State the Fundamental Theorem of Arithmetic.', a: 'Every composite number can be expressed as a unique product of prime numbers' },
          { q: 'Prove that √2 is irrational (state the approach).', a: 'Assume √2 = p/q (lowest terms); then 2q²=p², so p is even → p=2m → 2q²=4m² → q² is even → q is even — contradicts p/q being lowest terms' },
          { q: 'Find HCF of 96 and 404 using Euclid\'s algorithm.', a: '404=96×4+20; 96=20×4+16; 20=16×1+4; 16=4×4+0 → HCF=4' },
          { q: 'Is the decimal expansion of 17/8 terminating or non-terminating?', a: 'Terminating (denominator 8 = 2³, only factor 2)' },
        ]
      },
      {
        chapter: 'Quadratic Equations',
        topics: ['Standard form', 'Factorisation', 'Quadratic formula', 'Nature of roots (discriminant)'],
        qa: [
          { q: 'What is the standard form of a quadratic equation?', a: 'ax² + bx + c = 0, where a ≠ 0' },
          { q: 'Write the quadratic formula.', a: 'x = [−b ± √(b²−4ac)] / 2a' },
          { q: 'Solve: x² − 5x + 6 = 0', a: 'x = 2 or x = 3 (factors: (x−2)(x−3)=0)' },
          { q: 'What does discriminant D = b²−4ac tell us?', a: 'D>0: two real roots; D=0: one real root; D<0: no real roots' },
          { q: 'Solve: 2x² + x − 3 = 0 by factorisation.', a: '(2x+3)(x−1)=0 → x=1 or x=−3/2' },
        ]
      },
      {
        chapter: 'Triangles (Similarity)',
        topics: ['AA, SSS, SAS similarity', 'Basic Proportionality Theorem', 'Pythagoras Theorem'],
        qa: [
          { q: 'State the Basic Proportionality Theorem (Thales\' Theorem).', a: 'If a line is drawn parallel to one side of a triangle, it divides the other two sides proportionally' },
          { q: 'State the Pythagoras Theorem.', a: 'In a right triangle, (hypotenuse)² = (base)² + (perpendicular)²' },
          { q: 'In a right triangle with legs 6 and 8, find the hypotenuse.', a: '√(36+64) = √100 = 10' },
          { q: 'State the AA similarity criterion.', a: 'If two angles of one triangle equal two angles of another, the triangles are similar' },
          { q: 'If ΔABC ~ ΔDEF and AB/DE = 2/3, find the ratio of their areas.', a: '(2/3)² = 4/9' },
        ]
      },
    ],
    Science: [
      {
        chapter: 'Chemical Reactions & Equations',
        topics: ['Types of reactions', 'Balancing equations', 'Exothermic and endothermic'],
        qa: [
          { q: 'What is a chemical equation?', a: 'A symbolic representation of a chemical reaction using formulas of reactants and products' },
          { q: 'Balance: H₂ + O₂ → H₂O', a: '2H₂ + O₂ → 2H₂O' },
          { q: 'What is an exothermic reaction?', a: 'A reaction that releases heat energy (e.g., combustion)' },
          { q: 'What is an oxidation reaction?', a: 'A reaction where a substance gains oxygen or loses hydrogen' },
          { q: 'What is a double displacement reaction?', a: 'Ions of two compounds exchange places to form two new compounds (e.g., AgNO₃ + NaCl → AgCl + NaNO₃)' },
        ]
      },
      {
        chapter: 'Electricity',
        topics: ['Ohm\'s Law', 'Resistance, resistivity', 'Series and parallel circuits', 'Power'],
        qa: [
          { q: 'State Ohm\'s Law.', a: 'V = IR (Voltage = Current × Resistance), at constant temperature' },
          { q: 'What is the SI unit of resistance?', a: 'Ohm (Ω)' },
          { q: 'Two resistors 3Ω and 6Ω in series. Total resistance?', a: '3 + 6 = 9Ω' },
          { q: 'Two resistors 3Ω and 6Ω in parallel. Total resistance?', a: '1/R = 1/3 + 1/6 = 1/2 → R = 2Ω' },
          { q: 'Electric power formula?', a: 'P = VI = I²R = V²/R' },
        ]
      },
      {
        chapter: 'Light — Reflection & Refraction',
        topics: ['Laws of reflection', 'Mirrors', 'Snell\'s Law', 'Lens formula', 'Power of lens'],
        qa: [
          { q: 'State the laws of reflection.', a: '1) Angle of incidence = Angle of reflection; 2) Incident ray, normal, and reflected ray are in the same plane' },
          { q: 'State Snell\'s Law.', a: 'n₁ sin θ₁ = n₂ sin θ₂ (ratio of sines of angles equals ratio of refractive indices)' },
          { q: 'What type of image does a concave mirror form for object at C?', a: 'Real, inverted, same size, at C' },
          { q: 'What is the power of a lens with focal length 50 cm?', a: 'P = 1/f(m) = 1/0.5 = +2 D' },
          { q: 'Write the mirror formula.', a: '1/v + 1/u = 1/f' },
        ]
      },
    ],
    'Social Studies': [
      {
        chapter: 'Nationalism in India',
        topics: ['Non-Cooperation Movement', 'Civil Disobedience Movement', 'Quit India Movement'],
        qa: [
          { q: 'When was the Non-Cooperation Movement launched?', a: '1920 (by Mahatma Gandhi)' },
          { q: 'What was the Dandi March?', a: 'Gandhi\'s 240-mile march in 1930 to make salt from seawater, defying British salt tax' },
          { q: 'When was the Quit India Movement launched?', a: '8 August 1942' },
          { q: 'What happened at Jallianwala Bagh?', a: 'Massacre of peaceful Indian protesters by British troops in 1919' },
          { q: 'Who gave the slogan "Do or Die"?', a: 'Mahatma Gandhi (during Quit India Movement, 1942)' },
        ]
      },
      {
        chapter: 'Globalisation & Indian Economy',
        topics: ['What is globalisation', 'MNCs', 'WTO', 'Impact on India'],
        qa: [
          { q: 'Define globalisation.', a: 'The process of rapid integration of countries through trade, investment, and technology' },
          { q: 'What does MNC stand for?', a: 'Multinational Corporation (a company operating in more than one country)' },
          { q: 'What does WTO stand for?', a: 'World Trade Organization' },
          { q: 'Name one positive impact of globalisation on India.', a: 'Increased foreign investment / Better technology / More employment in export sectors (any one)' },
          { q: 'Name one negative impact of globalisation on India.', a: 'Small local industries face competition / Cultural changes / Job losses in some sectors (any one)' },
        ]
      },
    ],
    Computer: [
      {
        chapter: 'Database Management (Intro)',
        topics: ['DBMS concepts', 'Tables, records, fields', 'SQL basics', 'Types of databases'],
        qa: [
          { q: 'What is DBMS?', a: 'Database Management System — software to store, manage, and retrieve data (e.g., MySQL, Oracle)' },
          { q: 'What is a primary key?', a: 'A unique identifier for each record in a table' },
          { q: 'Write a SQL query to select all records from a table "students".', a: 'SELECT * FROM students;' },
          { q: 'What is a foreign key?', a: 'A field in one table that refers to the primary key of another table' },
          { q: 'Name two types of databases.', a: 'Relational Database / Non-relational (NoSQL) Database' },
        ]
      },
    ],
  },
};

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Get all subjects available for a given class.
 * @param {string|number} classNum  e.g. '6' or 6
 * @returns {string[]}
 */
function getCurriculumSubjects(classNum) {
  const data = CURRICULUM_LIBRARY[String(classNum)];
  return data ? Object.keys(data) : [];
}

/**
 * Get chapters for a class + subject.
 * @returns {Array<{chapter, topics, qa}>}
 */
function getCurriculumChapters(classNum, subject) {
  const data = CURRICULUM_LIBRARY[String(classNum)];
  return (data && data[subject]) ? data[subject] : [];
}

/**
 * Get all Q&A for a specific chapter.
 * @returns {Array<{q, a}>}
 */
function getChapterQA(classNum, subject, chapterName) {
  const chapters = getCurriculumChapters(classNum, subject);
  const ch = chapters.find(c => c.chapter === chapterName);
  return ch ? ch.qa : [];
}

/**
 * Get all Q&A for a class + subject (all chapters combined).
 * Supports both old format {qa:[]} and new format {short:[],long:[],mcq:[]}.
 */
function getAllQAForSubject(classNum, subject) {
  const chapters = getCurriculumChapters(classNum, subject);
  return chapters.flatMap(c => {
    const all = [];
    (c.short || c.qa || []).forEach(q => all.push({ ...q, chapter: c.chapter, type: 'short' }));
    (c.long  || []).forEach(q => all.push({ ...q, chapter: c.chapter, type: 'long' }));
    (c.mcq   || []).forEach(q => all.push({ ...q, chapter: c.chapter, type: 'mcq' }));
    return all;
  });
}

/**
 * Returns all available class keys (NUR, KG, 1–10).
 */
function getCurriculumClasses() {
  return Object.keys(CURRICULUM_LIBRARY);
}
