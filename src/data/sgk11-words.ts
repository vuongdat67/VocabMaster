import type { CompactWord } from './compact-format'

// SGK Tiếng Anh 11 - Theme-based vocabulary
export const sgk11Data: CompactWord[] = [
  // Unit 1: The Generation Gap
  { w: 'generation', ipa: '/ˌdʒenəˈreɪʃn/', pos: 'noun', vi: 'thế hệ', en: 'all people born at about the same time', ex: 'The younger generation uses technology differently.', tags: ['sgk11', 'society'], diff: 2 },
  { w: 'gap', ipa: '/ɡæp/', pos: 'noun', vi: 'khoảng cách', en: 'a difference or division', ex: 'The generation gap causes misunderstandings.', tags: ['sgk11', 'society'], diff: 2 },
  { w: 'conflict', ipa: '/ˈkɒnflɪkt/', pos: 'noun', vi: 'xung đột', en: 'a serious disagreement', ex: 'Parents and teenagers often have conflicts.', syn: ['dispute'], tags: ['sgk11', 'society'], diff: 2 },
  { w: 'rebellious', ipa: '/rɪˈbeliəs/', pos: 'adjective', vi: 'nổi loạn', en: 'showing a desire to resist authority', ex: 'Rebellious teenagers often argue with parents.', tags: ['sgk11', 'society'], diff: 3 },

  // Unit 2: Relationships
  { w: 'relationship', ipa: '/rɪˈleɪʃnʃɪp/', pos: 'noun', vi: 'mối quan hệ', en: 'the way two people feel about each other', ex: 'A good relationship requires trust.', tags: ['sgk11', 'relationships'], diff: 2 },
  { w: 'sympathy', ipa: '/ˈsɪmpəθi/', pos: 'noun', vi: 'sự đồng cảm', en: 'feeling pity or sorrow for others', ex: 'She showed sympathy for her friend.', tags: ['sgk11', 'relationships'], diff: 3 },
  { w: 'trust', ipa: '/trʌst/', pos: 'noun/verb', vi: 'tin tưởng', en: 'firm belief in reliability', ex: 'Trust is important in any relationship.', syn: ['confidence'], tags: ['sgk11', 'relationships'], diff: 1 },
  { w: 'quarrel', ipa: '/ˈkwɒrəl/', pos: 'noun/verb', vi: 'cãi nhau', en: 'an angry argument', ex: 'They had a quarrel about money.', syn: ['argument'], tags: ['sgk11', 'relationships'], diff: 2 },

  // Unit 3: Becoming Independent
  { w: 'independent', ipa: '/ˌɪndɪˈpendənt/', pos: 'adjective', vi: 'độc lập', en: 'free from outside control', ex: 'Teens want to be independent.', syn: ['self-reliant'], tags: ['sgk11', 'life-skills'], diff: 2 },
  { w: 'responsible', ipa: '/rɪˈspɒnsəbl/', pos: 'adjective', vi: 'có trách nhiệm', en: 'having an obligation to do something', ex: 'Be responsible for your actions.', tags: ['sgk11', 'life-skills'], diff: 2 },
  { w: 'decision', ipa: '/dɪˈsɪʒn/', pos: 'noun', vi: 'quyết định', en: 'a conclusion reached after consideration', ex: 'Making decisions is a key skill.', tags: ['sgk11', 'life-skills'], diff: 1 },
  { w: 'confidence', ipa: '/ˈkɒnfɪdəns/', pos: 'noun', vi: 'sự tự tin', en: 'a feeling of self-assurance', ex: 'Build your confidence through practice.', tags: ['sgk11', 'life-skills'], diff: 2 },

  // Unit 4: Caring for Those in Need
  { w: 'disabled', ipa: '/dɪsˈeɪbld/', pos: 'adjective', vi: 'khuyết tật', en: 'having a physical or mental impairment', ex: 'We should help disabled people.', tags: ['sgk11', 'community'], diff: 2 },
  { w: 'charity', ipa: '/ˈtʃærəti/', pos: 'noun', vi: 'từ thiện', en: 'voluntary help for those in need', ex: 'She works for a charity organization.', tags: ['sgk11', 'community'], diff: 2 },
  { w: 'volunteer', ipa: '/ˌvɒlənˈtɪər/', pos: 'noun/verb', vi: 'tình nguyện', en: 'a person who freely offers to do something', ex: 'He volunteered to help the elderly.', tags: ['sgk11', 'community'], diff: 2 },
  { w: 'orphanage', ipa: '/ˈɔːfənɪdʒ/', pos: 'noun', vi: 'trại trẻ mồ côi', en: 'a home for orphans', ex: 'We visited the orphanage.', tags: ['sgk11', 'community'], diff: 2 },

  // Unit 5: Being Part of ASEAN
  { w: 'association', ipa: '/əˌsəʊsiˈeɪʃn/', pos: 'noun', vi: 'hiệp hội', en: 'a group organized for a common purpose', ex: 'ASEAN is a regional association.', tags: ['sgk11', 'asean'], diff: 3 },
  { w: 'cooperate', ipa: '/kəʊˈɒpəreɪt/', pos: 'verb', vi: 'hợp tác', en: 'to work together', ex: 'Countries must cooperate for peace.', syn: ['collaborate'], tags: ['sgk11', 'asean'], diff: 3 },
  { w: 'integration', ipa: '/ˌɪntɪˈɡreɪʃn/', pos: 'noun', vi: 'hội nhập', en: 'the act of combining into a whole', ex: 'Regional integration brings benefits.', tags: ['sgk11', 'asean'], diff: 3 },
  { w: 'solidarity', ipa: '/ˌsɒlɪˈdærəti/', pos: 'noun', vi: 'đoàn kết', en: 'unity and mutual support', ex: 'ASEAN promotes solidarity.', tags: ['sgk11', 'asean'], diff: 3 },

  // Unit 6: Global Warming
  { w: 'global warming', ipa: '/ˈɡləʊbl ˈwɔːmɪŋ/', pos: 'noun', vi: 'sự nóng lên toàn cầu', en: 'the increase in earth\'s temperature', ex: 'Global warming is a serious issue.', tags: ['sgk11', 'environment'], diff: 2 },
  { w: 'emission', ipa: '/ɪˈmɪʃn/', pos: 'noun', vi: 'khí thải', en: 'the production and discharge of something', ex: 'Carbon emissions must be reduced.', tags: ['sgk11', 'environment'], diff: 3 },
  { w: 'greenhouse', ipa: '/ˈɡriːnhaʊs/', pos: 'noun', vi: 'nhà kính', en: 'a glass building for growing plants', ex: 'The greenhouse effect traps heat.', tags: ['sgk11', 'environment'], diff: 2 },
  { w: 'catastrophe', ipa: '/kəˈtæstrəfi/', pos: 'noun', vi: 'thảm họa', en: 'a sudden disaster', ex: 'Climate change could cause a catastrophe.', tags: ['sgk11', 'environment'], diff: 4 },

  // Unit 7: Further Education
  { w: 'scholarship', ipa: '/ˈskɒləʃɪp/', pos: 'noun', vi: 'học bổng', en: 'financial aid for education', ex: 'She won a scholarship to study abroad.', tags: ['sgk11', 'education'], diff: 2 },
  { w: 'undergraduate', ipa: '/ˌʌndərˈɡrædʒuət/', pos: 'noun', vi: 'sinh viên đại học', en: 'a university student who hasn\'t graduated', ex: 'He is an undergraduate at Harvard.', tags: ['sgk11', 'education'], diff: 3 },
  { w: 'vocational', ipa: '/vəʊˈkeɪʃənl/', pos: 'adjective', vi: 'hướng nghiệp', en: 'relating to an occupation', ex: 'Vocational training provides practical skills.', tags: ['sgk11', 'education'], diff: 3 },
  { w: 'tuition', ipa: '/tjuˈɪʃn/', pos: 'noun', vi: 'học phí', en: 'teaching or instruction fees', ex: 'Tuition fees have increased.', tags: ['sgk11', 'education'], diff: 2 },

  // Unit 8: Our World Heritage Sites
  { w: 'heritage', ipa: '/ˈherɪtɪdʒ/', pos: 'noun', vi: 'di sản', en: 'something inherited from the past', ex: 'Ha Long Bay is a World Heritage site.', tags: ['sgk11', 'culture'], diff: 2 },
  { w: 'monument', ipa: '/ˈmɒnjumənt/', pos: 'noun', vi: 'tượng đài', en: 'a structure built to commemorate', ex: 'The monument attracts many tourists.', tags: ['sgk11', 'culture'], diff: 2 },
  { w: 'archaeological', ipa: '/ˌɑːrkiəˈlɒdʒɪkl/', pos: 'adjective', vi: 'khảo cổ', en: 'relating to archaeology', ex: 'Archaeological sites reveal history.', tags: ['sgk11', 'culture'], diff: 4 },
  { w: 'preservation', ipa: '/ˌprezərˈveɪʃn/', pos: 'noun', vi: 'bảo tồn', en: 'the act of preserving', ex: 'Heritage preservation is important.', tags: ['sgk11', 'culture'], diff: 3 },

  // Unit 9: Cities of the Future
  { w: 'urbanization', ipa: '/ˌɜːrbənaɪˈzeɪʃn/', pos: 'noun', vi: 'đô thị hóa', en: 'the growth of cities', ex: 'Urbanization is happening rapidly.', tags: ['sgk11', 'future'], diff: 4 },
  { w: 'infrastructure', ipa: '/ˈɪnfrəstrʌktʃər/', pos: 'noun', vi: 'cơ sở hạ tầng', en: 'the basic physical systems of a society', ex: 'Good infrastructure is essential.', tags: ['sgk11', 'future'], diff: 3 },
  { w: 'megacity', ipa: '/ˈmeɡəsɪti/', pos: 'noun', vi: 'siêu đô thị', en: 'a very large city with over 10 million people', ex: 'Tokyo is a megacity.', tags: ['sgk11', 'future'], diff: 2 },
  { w: 'sustainable', ipa: '/səˈsteɪnəbl/', pos: 'adjective', vi: 'bền vững', en: 'environmentally friendly and lasting', ex: 'Future cities must be sustainable.', tags: ['sgk11', 'future'], diff: 3 },

  // Unit 10: Healthy Lifestyle and Longevity
  { w: 'longevity', ipa: '/lɒnˈdʒevəti/', pos: 'noun', vi: 'tuổi thọ', en: 'long life', ex: 'A healthy diet contributes to longevity.', tags: ['sgk11', 'health'], diff: 3 },
  { w: 'nutrition', ipa: '/njuˈtrɪʃn/', pos: 'noun', vi: 'dinh dưỡng', en: 'the process of providing food for health', ex: 'Good nutrition is vital for health.', tags: ['sgk11', 'health'], diff: 2 },
  { w: 'obesity', ipa: '/əʊˈbiːsəti/', pos: 'noun', vi: 'béo phì', en: 'the condition of being very overweight', ex: 'Obesity is a growing health problem.', tags: ['sgk11', 'health'], diff: 3 },
  { w: 'well-being', ipa: '/ˈwel biːɪŋ/', pos: 'noun', vi: 'sức khỏe, phúc lợi', en: 'the state of being comfortable, healthy, or happy', ex: 'Exercise improves mental well-being.', tags: ['sgk11', 'health'], diff: 2 },
]
