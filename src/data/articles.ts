export interface Article {
  id: string
  title: string
  level: string
  content: string
}

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'The Wise Old Owl',
    level: 'Beginner',
    content: `There was an old owl who lived in an oak tree. Every day, he observed the incidents that occurred around him. Yesterday, he watched as a young boy helped an old man carry a heavy basket. Today, he saw a young girl shouting at her mother. The more he saw, the less he spoke.
As the days went on, he spoke less but heard more. The old owl heard people talking and telling stories. He heard a woman saying an elephant jumped over a fence. He heard a man saying that he had never made a mistake.
The old owl had seen and heard what happened to people. There were some who became better, some who became worse. But the old owl in the tree had become wiser, each and every day.`
  },
  {
    id: 'a2',
    title: 'The Golden Touch',
    level: 'Intermediate',
    content: `There once was a king named Midas who did a good deed for a satyr. And he was then granted a wish by Dionysus, the god of wine.
For his wish, Midas asked that whatever he touched would turn to gold. Despite Dionysus’ efforts to prevent it, Midas pleaded that this was a fantastic wish, and so, it was bestowed.
Excitedly, Midas went about touching all sorts of things, turning them into solid gold. Soon, he became hungry. He picked up a piece of food, but he couldn't eat it, for it had turned to gold in his hand!
Midas groaned, "I'll starve! Perhaps this was not such an excellent wish after all!" Seeing his dismay, his beloved daughter threw her arms around him to comfort him, and she, too, turned to gold. "The golden touch is no blessing," Midas cried.`
  },
  {
    id: 'a3',
    title: 'A Byte of Tech',
    level: 'Advanced',
    content: `Artificial intelligence is rapidly transforming the modern landscape of technology. From predictive algorithms that power our search engines to autonomous vehicles navigating complex urban environments, AI is ubiquitous.
One of the most fascinating domains is natural language processing (NLP). NLP enables machines to comprehend, interpret, and manipulate human language. Consider how smart assistants seamlessly transcribe spoken inquiries into actionable commands. 
However, the proliferation of AI also raises ethical concerns. Issues surrounding data privacy, algorithmic bias, and the potential displacement of the workforce necessitate comprehensive regulatory frameworks. Ultimately, the trajectory of artificial intelligence will depend on how humanity navigates these profound challenges.`
  }
]
