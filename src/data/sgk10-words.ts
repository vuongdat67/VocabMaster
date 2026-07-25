import type { CompactWord } from './compact-format'

// SGK Tiếng Anh 10 - Theme-based vocabulary
export const sgk10Data: CompactWord[] = [
  // Unit 1: Family Life
  { w: 'chore', ipa: '/tʃɔːr/', pos: 'noun', vi: 'việc vặt', en: 'a routine task, especially a household one', ex: 'I do household chores every weekend.', syn: ['task', 'duty'], tags: ['sgk10', 'family'], diff: 2 },
  { w: 'household', ipa: '/ˈhaʊshəʊld/', pos: 'noun', vi: 'hộ gia đình', en: 'a house and its occupants', ex: 'All household members share the work.', tags: ['sgk10', 'family'], diff: 2 },
  { w: 'contribute', ipa: '/kənˈtrɪbjuːt/', pos: 'verb', vi: 'đóng góp', en: 'to give something to help', ex: 'Everyone should contribute to the household.', syn: ['donate', 'provide'], tags: ['sgk10', 'family'], diff: 2 },
  { w: 'benefit', ipa: '/ˈbenɪfɪt/', pos: 'noun/verb', vi: 'lợi ích', en: 'an advantage or profit', ex: 'Sharing chores brings many benefits.', syn: ['advantage'], tags: ['sgk10', 'family'], diff: 2 },

  // Unit 2: Your Body and You
  { w: 'skeleton', ipa: '/ˈskelɪtn/', pos: 'noun', vi: 'bộ xương', en: 'the framework of bones in the body', ex: 'The human skeleton has 206 bones.', tags: ['sgk10', 'body'], diff: 3 },
  { w: 'digest', ipa: '/daɪˈdʒest/', pos: 'verb', vi: 'tiêu hóa', en: 'to break down food in the body', ex: 'It takes hours to digest food.', tags: ['sgk10', 'body'], diff: 3 },
  { w: 'immune', ipa: '/ɪˈmjuːn/', pos: 'adjective', vi: 'miễn dịch', en: 'resistant to disease', ex: 'A healthy diet boosts your immune system.', tags: ['sgk10', 'body'], diff: 3 },
  { w: 'respiratory', ipa: '/rəˈspɪrətɔːri/', pos: 'adjective', vi: 'hô hấp', en: 'relating to breathing', ex: 'The respiratory system includes the lungs.', tags: ['sgk10', 'body'], diff: 4 },

  // Unit 3: Music
  { w: 'melody', ipa: '/ˈmelədi/', pos: 'noun', vi: 'giai điệu', en: 'a sequence of musical notes', ex: 'The melody was beautiful.', syn: ['tune'], tags: ['sgk10', 'music'], diff: 2 },
  { w: 'compose', ipa: '/kəmˈpəʊz/', pos: 'verb', vi: 'sáng tác', en: 'to create music or a piece of writing', ex: 'Beethoven composed many symphonies.', syn: ['create', 'write'], tags: ['sgk10', 'music'], diff: 3 },
  { w: 'performer', ipa: '/pərˈfɔːrmər/', pos: 'noun', vi: 'người biểu diễn', en: 'a person who performs', ex: 'The performer received a standing ovation.', syn: ['artist'], tags: ['sgk10', 'music'], diff: 2 },
  { w: 'audience', ipa: '/ˈɔːdiəns/', pos: 'noun', vi: 'khán giả', en: 'the people watching a performance', ex: 'The audience clapped loudly.', tags: ['sgk10', 'music'], diff: 2 },

  // Unit 4: For a Better Community
  { w: 'volunteer', ipa: '/ˌvɒlənˈtɪər/', pos: 'noun/verb', vi: 'tình nguyện viên', en: 'a person who offers to do something', ex: 'She volunteers at the local hospital.', tags: ['sgk10', 'community'], diff: 2 },
  { w: 'charity', ipa: '/ˈtʃærəti/', pos: 'noun', vi: 'từ thiện', en: 'an organization helping the needy', ex: 'We donated to charity.', tags: ['sgk10', 'community'], diff: 2 },
  { w: 'community', ipa: '/kəˈmjuːnəti/', pos: 'noun', vi: 'cộng đồng', en: 'a group of people living together', ex: 'The community center offers many services.', tags: ['sgk10', 'community'], diff: 2 },
  { w: 'donate', ipa: '/dəʊˈneɪt/', pos: 'verb', vi: 'quyên góp', en: 'to give something for a good cause', ex: 'Many people donated money.', syn: ['give', 'contribute'], tags: ['sgk10', 'community'], diff: 2 },

  // Unit 5: Inventions
  { w: 'invention', ipa: '/ɪnˈvenʃn/', pos: 'noun', vi: 'phát minh', en: 'a new device or method', ex: 'The invention of the telephone changed communication.', syn: ['creation', 'innovation'], tags: ['sgk10', 'inventions'], diff: 3 },
  { w: 'portable', ipa: '/ˈpɔːtəbl/', pos: 'adjective', vi: 'có thể mang theo', en: 'able to be carried', ex: 'Laptops are portable computers.', tags: ['sgk10', 'inventions'], diff: 2 },
  { w: 'device', ipa: '/dɪˈvaɪs/', pos: 'noun', vi: 'thiết bị', en: 'a piece of equipment', ex: 'Modern devices make life easier.', syn: ['gadget', 'appliance'], tags: ['sgk10', 'inventions'], diff: 2 },
  { w: 'patent', ipa: '/ˈpeɪtnt/', pos: 'noun', vi: 'bằng sáng chế', en: 'the exclusive right to an invention', ex: 'He filed a patent for his invention.', tags: ['sgk10', 'inventions'], diff: 3 },

  // Unit 6: Gender Equality
  { w: 'equality', ipa: '/iˈkwɒləti/', pos: 'noun', vi: 'bình đẳng', en: 'the state of being equal', ex: 'Gender equality benefits everyone.', syn: ['fairness', 'equity'], tags: ['sgk10', 'gender'], diff: 3 },
  { w: 'discrimination', ipa: '/dɪˌskrɪmɪˈneɪʃn/', pos: 'noun', vi: 'phân biệt đối xử', en: 'unfair treatment based on a category', ex: 'Discrimination based on gender is illegal.', tags: ['sgk10', 'gender'], diff: 3 },
  { w: 'opportunity', ipa: '/ˌɒpəˈtjuːnəti/', pos: 'noun', vi: 'cơ hội', en: 'a chance or possibility', ex: 'Equal opportunities for all.', tags: ['sgk10', 'gender'], diff: 2 },
  { w: 'pursue', ipa: '/pəˈsjuː/', pos: 'verb', vi: 'theo đuổi', en: 'to follow or chase a goal', ex: 'Women can pursue any career they want.', tags: ['sgk10', 'gender'], diff: 3 },

  // Unit 7: Cultural Diversity
  { w: 'diversity', ipa: '/daɪˈvɜːrsəti/', pos: 'noun', vi: 'đa dạng', en: 'the state of being varied', ex: 'Cultural diversity enriches society.', syn: ['variety'], tags: ['sgk10', 'culture'], diff: 3 },
  { w: 'custom', ipa: '/ˈkʌstəm/', pos: 'noun', vi: 'phong tục', en: 'a traditional practice', ex: 'Each country has its own customs.', tags: ['sgk10', 'culture'], diff: 2 },
  { w: 'tradition', ipa: '/trəˈdɪʃn/', pos: 'noun', vi: 'truyền thống', en: 'a long-established custom', ex: 'We maintain our traditions.', tags: ['sgk10', 'culture'], diff: 2 },
  { w: 'ceremony', ipa: '/ˈserəməni/', pos: 'noun', vi: 'nghi lễ', en: 'a formal ritual or event', ex: 'The wedding ceremony was beautiful.', tags: ['sgk10', 'culture'], diff: 3 },

  // Unit 8: New Ways to Learn
  { w: 'electronic', ipa: '/ɪˌlekˈtrɒnɪk/', pos: 'adjective', vi: 'điện tử', en: 'operating by electricity', ex: 'Electronic devices help us learn.', tags: ['sgk10', 'learning'], diff: 2 },
  { w: 'concentrate', ipa: '/ˈkɒnsntreɪt/', pos: 'verb', vi: 'tập trung', en: 'to focus attention', ex: 'I need to concentrate on my studies.', syn: ['focus'], tags: ['sgk10', 'learning'], diff: 2 },
  { w: 'access', ipa: '/ˈækses/', pos: 'noun/verb', vi: 'truy cập', en: 'the means of approaching', ex: 'Students can access online resources.', tags: ['sgk10', 'learning'], diff: 2 },
  { w: 'effective', ipa: '/ɪˈfektɪv/', pos: 'adjective', vi: 'hiệu quả', en: 'producing the desired result', ex: 'Find effective ways to learn.', syn: ['efficient'], tags: ['sgk10', 'learning'], diff: 2 },

  // Unit 9: Preserving the environment
  { w: 'preserve', ipa: '/prɪˈzɜːv/', pos: 'verb', vi: 'bảo tồn', en: 'to maintain in its original state', ex: 'We must preserve the environment.', syn: ['protect', 'conserve'], tags: ['sgk10', 'environment'], diff: 3 },
  { w: 'ecosystem', ipa: '/ˈiːkəʊsɪstəm/', pos: 'noun', vi: 'hệ sinh thái', en: 'a biological community of interacting organisms', ex: 'The forest ecosystem is fragile.', tags: ['sgk10', 'environment'], diff: 3 },
  { w: 'sustainable', ipa: '/səˈsteɪnəbl/', pos: 'adjective', vi: 'bền vững', en: 'able to be maintained over time', ex: 'We need sustainable development.', tags: ['sgk10', 'environment'], diff: 3 },
  { w: 'pollution', ipa: '/pəˈluːʃn/', pos: 'noun', vi: 'ô nhiễm', en: 'the presence of harmful substances', ex: 'Air pollution affects health.', tags: ['sgk10', 'environment'], diff: 2 },

  // Unit 10: Eco-tourism
  { w: 'eco-tourism', ipa: '/ˈiːkəʊ ˌtʊərɪzəm/', pos: 'noun', vi: 'du lịch sinh thái', en: 'environmentally responsible tourism', ex: 'Eco-tourism helps protect nature.', tags: ['sgk10', 'tourism'], diff: 3 },
  { w: 'destination', ipa: '/ˌdestɪˈneɪʃn/', pos: 'noun', vi: 'điểm đến', en: 'the place to which someone is going', ex: 'This is a popular tourist destination.', tags: ['sgk10', 'tourism'], diff: 2 },
  { w: 'explore', ipa: '/ɪkˈsplɔːr/', pos: 'verb', vi: 'khám phá', en: 'to travel through an unfamiliar area', ex: 'We explored the national park.', syn: ['discover'], tags: ['sgk10', 'tourism'], diff: 2 },
  { w: 'landscape', ipa: '/ˈlændskeɪp/', pos: 'noun', vi: 'phong cảnh', en: 'all the visible features of an area', ex: 'The landscape was breathtaking.', tags: ['sgk10', 'tourism'], diff: 2 },
]
