import { Lesson } from "../types";

export const OCIA_LESSONS: Lesson[] = [
  // --- STAGE 1: INQUIRY ---
  {
    id: "inq-1",
    stage: 1,
    stageName: "The Period of Evangelization and the Pre-Catechumenate",
    title: "Seeking Truth: The Desire for God",
    description: "Explore the fundamental human search for meaning and God's initiative to reveal Himself.",
    duration: 10,
    content: `### Welcome to the Inquiry Stage!
This initial stage of your journey (often called the *Precatechumenate*) is a time of questioning, seeking, and exploring. There are no commitments here—only open doors and open hearts.

#### The Universal Human Search
Every human heart harbors a deep longing for truth, love, and purpose. In Catholic theology, we understand this longing as a **desire for God** written directly onto the human heart. St. Augustine famously wrote in his *Confessions*:
> *"You have made us for yourself, O Lord, and our heart is restless until it rests in You."*

#### God's Personal Invitation
We are not left to grope in the dark. God has initiated a relationship with humanity by revealing Himself in three main ways:
1. **Creation**: The beauty, order, and majesty of the universe.
2. **Divine Revelation**: God's self-communication through salvation history, recorded in Sacred Scripture (the Bible).
3. **Jesus Christ**: The fullness of God's revelation. Jesus is God-made-man, who walked among us to show us the Father's face.

#### Stages of OCIA
The Order of Christian Initiation of Adults is structured in progressive steps:
- **The Period of Evangelization and the Pre-Catechumenate**: Asking questions, exploring the Gospel.
- **The Period of the Catechumenate**: Systematic instruction, learning to live the Catholic faith.
- **The Period of Purification and Enlightenment**: Spiritual preparation during Lent leading to the Sacraments.
- **The Period of Mystagogy**: Deepening understanding and entering active parish mission.`,
    quiz: [
      {
        question: "Who wrote 'Our heart is restless until it rests in You'?",
        options: ["St. Thomas Aquinas", "St. Augustine", "St. Cyril of Jerusalem", "St. Peter"],
        correctIndex: 1,
        explanation: "St. Augustine wrote this in his 'Confessions', reflecting on his long journey of seeking truth before his conversion."
      },
      {
        question: "What is the primary purpose of the Period of Evangelization and the Pre-Catechumenate?",
        options: [
          "To complete formal examinations and tests",
          "To ask questions, explore the Gospel, and seek truth without commitment",
          "To perform public penance",
          "To select a sponsor immediately"
        ],
        correctIndex: 1,
        explanation: "This initial stage is a welcoming time of open questioning, listening, and initial evangelization without any official commitment."
      }
    ]
  },
  {
    id: "inq-2",
    stage: 1,
    stageName: "The Period of Evangelization and the Pre-Catechumenate",
    title: "Understanding Sacred Scripture",
    description: "Learn how Catholics read, interpret, and pray with the Holy Bible.",
    duration: 12,
    content: `### The Bible: God's Living Word
For Catholics, Sacred Scripture is not just a historical document, but the **living Word of God**. It is written by human authors inspired by the Holy Spirit.

#### Old and New Testaments
The Catholic Bible contains 73 books:
- **Old Testament (46 books)**: Tells the story of creation, the Covenant with Israel, and the preparation for the Messiah.
- **New Testament (27 books)**: Centers on the life, death, and resurrection of Jesus Christ (the Gospels), and the early Church (Acts, Epistles, Revelation).

#### How to Read Scripture
Catholics do not read the Bible in isolation or with a purely literalist lens. We interpret Scripture with three criteria:
1. **Be attentive to the content and unity of the whole Scripture**: We read individual passages in light of the entire Bible's message.
2. **Read the Scripture within the Living Tradition of the whole Church**: The Church's teachings help clarify meaning.
3. **Be attentive to the analogy of faith**: The coherence of the truths of faith among themselves.

#### Lectio Divina (Divine Reading)
A beautiful, ancient way to pray with Scripture is **Lectio Divina**, which involves four steps:
1. **Lectio (Read)**: Read a short passage slowly, listening for a word or phrase that stands out.
2. **Meditatio (Meditate)**: Reflect on what that word means in your life today.
3. **Oratio (Pray)**: Talk to God about what you discovered.
4. **Contemplatio (Contemplate)**: Rest quietly in God's presence, letting His love wash over you.`,
    quiz: [
      {
        question: "How many books are in the Catholic Bible?",
        options: ["66", "73", "80", "27"],
        correctIndex: 1,
        explanation: "The Catholic Bible contains 73 books: 46 in the Old Testament and 27 in the New Testament."
      }
    ]
  },

  // --- STAGE 2: CATECHUMENATE ---
  {
    id: "cat-1",
    stage: 2,
    stageName: "The Period of the Catechumenate",
    title: "The Seven Sacraments",
    description: "An overview of the visible signs instituted by Christ to confer invisible grace.",
    duration: 15,
    content: `### The Sacramental Life
When an Inquirer decides to make a formal step forward, they participate in the *Rite of Acceptance* (for unbaptized candidates) or *Rite of Welcoming* (for baptized Christians). They enter the **Catechumenate**, becoming *Catechumens* or *Candidates*.

#### What is a Sacrament?
The Catechism defines a Sacrament as:
> *"An outward sign instituted by Christ, to give grace."*
They are not merely symbolic; they actually accomplish what they signify (they are *efficacious*).

#### The Seven Sacraments
They are divided into three categories:

1. **Sacraments of Christian Initiation**:
   - **Baptism**: Cleanses original sin, makes us children of God and members of the Church.
   - **Confirmation**: Seals and strengthens us with the gifts of the Holy Spirit.
   - **Eucharist**: The source and summit of Christian life; the real body, blood, soul, and divinity of Jesus.

2. **Sacraments of Healing**:
   - **Reconciliation (Penance/Confession)**: Forgives sins committed after Baptism, restoring our relationship with God and the Church.
   - **Anointing of the Sick**: Strengthens, comforts, and grants spiritual (and sometimes physical) healing to the seriously ill.

3. **Sacraments at the Service of Communion**:
   - **Holy Orders**: Ordains bishops, priests, and deacons to serve the Church.
   - **Matrimony**: Joins a man and a woman in a life-long covenant of love, reflecting Christ's love for the Church.`,
    quiz: [
      {
        question: "Which Sacraments are known as the Sacraments of Initiation?",
        options: [
          "Baptism, Confirmation, and Eucharist",
          "Reconciliation and Anointing of the Sick",
          "Holy Orders and Matrimony",
          "Baptism and Reconciliation"
        ],
        correctIndex: 0,
        explanation: "Baptism, Confirmation, and the Holy Eucharist lay the foundations of every Christian life and constitute the Sacraments of Initiation."
      }
    ]
  },
  {
    id: "cat-2",
    stage: 2,
    stageName: "The Period of the Catechumenate",
    title: "Liturgy and the Mass",
    description: "Deconstruct the structure, prayers, and significance of the Holy Mass.",
    duration: 14,
    content: `### The Mass: Our Highest Prayer
The Holy Mass is the highest form of liturgical worship in the Catholic Church. It is where heaven touches earth, and we participate in Christ's perfect sacrifice on the cross.

#### Structure of the Mass
The Mass is divided into two primary parts, forming one single act of worship:

1. **Liturgy of the Word**:
   - **Gathering Rites**: Sign of the Cross, Penitential Act, Gloria.
   - **Scripture Readings**: First Reading (usually Old Testament), Responsorial Psalm, Second Reading (Epistle), and the Gospel.
   - **Homily & Creed**: The priest unpacks the readings, and we profess our shared faith.
   - **Universal Prayer**: Petitions for the Church, world, and needy.

2. **Liturgy of the Eucharist**:
   - **Presentation of the Gifts**: Bread and wine are brought forward.
   - **Eucharistic Prayer**: The priest prays the words of Christ at the Last Supper, and by the power of the Holy Spirit, **transubstantiation** occurs—bread and wine become Christ's Body and Blood.
   - **Communion Rite**: The Lord's Prayer, Sign of Peace, and receiving Holy Communion.
   - **Concluding Rites**: Blessing and dismissal, sending us out to love and serve the Lord.`,
    quiz: [
      {
        question: "What are the two primary parts of the Holy Mass?",
        options: [
          "Penitential Act and Communion Rite",
          "Liturgy of the Word and Liturgy of the Eucharist",
          "Scripture Readings and Concluding Blessing",
          "The Creed and the Lord's Prayer"
        ],
        correctIndex: 1,
        explanation: "The Mass is structured as one single act of worship comprising the Liturgy of the Word and the Liturgy of the Eucharist."
      }
    ]
  },

  // --- STAGE 3: PURIFICATION ---
  {
    id: "pur-1",
    stage: 3,
    stageName: "The Period of Purification and Enlightenment",
    title: "Prayer and spiritual warfare",
    description: "Deepen your prayer life, learn of the Scrutinies, and prepare for the Sacraments.",
    duration: 15,
    content: `### The Period of Purification and Enlightenment
This stage typically begins on the **First Sunday of Lent** with the *Rite of Election*. The catechumens are now called the **Elect**. This is a intense spiritual period focused on self-examination, healing, and deep prayer.

#### The Scrutinies
On the 3rd, 4th, and 5th Sundays of Lent, the Church celebrates the **Scrutinies** with the Elect.
These are ancient rites of healing and deliverance. They are meant to:
- **Scrutinize**: Expose and heal anything weak, defective, or sinful in the Elect's hearts.
- **Strengthen**: Reinforce everything that is upright, strong, and good.
- Deliver the Elect from the power of evil and fill them with the grace of Christ.

#### The Three Pillars of Lent
1. **Prayer**: Staying connected to the Vine (Christ). Speaking and listening to God daily.
2. **Fasting**: Mortifying our bodily appetites to strengthen our wills, reminding us that we 'do not live on bread alone'.
3. **Almsgiving**: Giving generously to the poor, overcoming selfishness, and growing in charity.`,
    quiz: [
      {
        question: "What are the Scrutinies primarily meant to do?",
        options: [
          "Expose academic knowledge of Catholic teaching",
          "Expose and heal sinful tendencies, and strengthen what is good and holy",
          "Publicly criticize the candidates",
          "Collect tithes and community fees"
        ],
        correctIndex: 1,
        explanation: "The Scrutinies are beautiful rites celebrated during Lent for healing, deliverance, self-examination, and spiritual strengthening."
      }
    ]
  },

  // --- STAGE 4: MYSTAGOGY ---
  {
    id: "mys-1",
    stage: 4,
    stageName: "The Period of Mystagogy",
    title: "Living as a Disciple of Christ",
    description: "You are baptized and confirmed! Now, explore how to live the mission out in the parish and world.",
    duration: 18,
    content: `### Welcome to Mystagogy!
At the Easter Vigil, you received the Sacraments of Initiation! You are now *Neophytes*—newly initiated Catholics. 

#### What is Mystagogy?
The word **Mystagogy** comes from the Greek meaning *'to enter into the mysteries'*. 
During this final stage (which lasts through the Easter season, and really for the rest of your life), you are invited to reflect deeply on your experience of the Sacraments and grow into an active member of Christ's body.

#### The Mission of the Neophyte
1. **Regular Sacramental Life**: Attending Mass every Sunday, receiving Holy Communion in a state of grace, and utilizing the Sacrament of Reconciliation regularly.
2. **Parish Community**: Joining ministries, small faith groups, Bible studies, or charitable works in your local parish.
3. **Evangelization**: Sharing your testimony! You are called to bring Christ to your workplace, family, and friendships by both your words and your actions.
4. **Vocation**: Discerning how God is calling you to serve Him—whether in marriage, single life, religious life, or Holy Orders.`,
    quiz: [
      {
        question: "What does the word Mystagogy literally mean?",
        options: [
          "To learn the laws",
          "To enter into the mysteries",
          "To perform charitable works",
          "To exit the temple"
        ],
        correctIndex: 1,
        explanation: "Mystagogy is a Greek term meaning 'entering or leading into the mysteries', referring to the post-sacramental exploration of faith."
      }
    ]
  }
];
