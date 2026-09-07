/**
 * Human Skeletal Database
 * ------------------------------------------------------------------
 * 206 named bones of the adult human skeleton, grouped by region.
 *
 * Each record carries the fields a medical student is actually asked
 * about in a viva: Latin/Terminologia Anatomica name, bone class,
 * palpable and non-palpable landmarks, articulations, principal muscle
 * attachments, ossification timetable and high-yield clinical notes.
 *
 * Sources cross-checked against: Gray's Anatomy (42nd ed.), Moore's
 * Clinically Oriented Anatomy (8th ed.), Terminologia Anatomica (2nd ed.),
 * and Netter's Atlas of Human Anatomy (7th ed.).
 */

export const REGIONS = {
  skull:      { label: 'Skull',              color: 0xd8cfc0, order: 1 },
  ossicles:   { label: 'Auditory Ossicles',  color: 0xe0d2b8, order: 2 },
  hyoid:      { label: 'Hyoid',              color: 0xdccfb6, order: 3 },
  vertebral:  { label: 'Vertebral Column',   color: 0xd6cbb6, order: 4 },
  thoracic:   { label: 'Thoracic Cage',      color: 0xdad0bc, order: 5 },
  pectoral:   { label: 'Pectoral Girdle',    color: 0xd4c9b4, order: 6 },
  upperlimb:  { label: 'Upper Limb',         color: 0xd9cfba, order: 7 },
  pelvic:     { label: 'Pelvic Girdle',      color: 0xd2c7b1, order: 8 },
  lowerlimb:  { label: 'Lower Limb',         color: 0xd7ccb7, order: 9 },
};

/** Axial vs appendicular classification for the filter bar. */
export const DIVISIONS = {
  axial:         ['skull', 'ossicles', 'hyoid', 'vertebral', 'thoracic'],
  appendicular:  ['pectoral', 'upperlimb', 'pelvic', 'lowerlimb'],
};

export const BONES = [

  /* ==============================================================
   * NEUROCRANIUM — 8 bones
   * ============================================================== */
  {
    id: 'frontal', name: 'Frontal Bone', latin: 'Os frontale',
    region: 'skull', group: 'Neurocranium', type: 'Flat bone', count: 1, paired: false,
    desc: 'Forms the forehead, the roof of the orbits and the anterior cranial fossa floor. Develops from two halves united by the metopic suture, which normally fuses by the sixth year.',
    landmarks: ['Squamous part (forehead)', 'Supraorbital margin and notch/foramen', 'Glabella', 'Superciliary arches', 'Frontal (metopic) suture remnant', 'Orbital plates', 'Frontal sinuses', 'Nasion'],
    articulations: ['Parietal bones (coronal suture)', 'Sphenoid (greater and lesser wings)', 'Ethmoid', 'Nasal bones', 'Maxillae', 'Lacrimal bones', 'Zygomatic bones'],
    muscles: ['Temporalis (temporal line)', 'Corrugator supercilii', 'Occipitofrontalis — frontal belly (via galea)', 'Orbicularis oculi'],
    ossify: 'Intramembranous. Two primary centres at the frontal eminences from week 8 in utero. Metopic suture closes 2–6 years; persists in ~8% of adults (metopism).',
    clinical: 'The supraorbital nerve (V1) exits the supraorbital notch — pressure here is the standard trigeminal test in a GCS assessment. Frontal sinusitis refers pain to the forehead. Frontal bone fractures involving the posterior table risk CSF rhinorrhoea and meningitis.',
  },
  {
    id: 'parietal', name: 'Parietal Bone', latin: 'Os parietale',
    region: 'skull', group: 'Neurocranium', type: 'Flat bone', count: 2, paired: true,
    desc: 'Paired quadrilateral plates forming the bulk of the cranial vault roof and lateral walls. Each has four borders and four angles, and is the classic example of a flat bone with diploë sandwiched between inner and outer tables.',
    landmarks: ['Parietal eminence (tuber)', 'Superior and inferior temporal lines', 'Groove for middle meningeal artery (inner surface)', 'Parietal foramen', 'Bregma', 'Lambda', 'Pterion', 'Asterion'],
    articulations: ['Opposite parietal (sagittal suture)', 'Frontal (coronal suture)', 'Occipital (lambdoid suture)', 'Temporal (squamous suture)', 'Sphenoid greater wing'],
    muscles: ['Temporalis (below inferior temporal line)'],
    ossify: 'Intramembranous, single centre at the parietal eminence in week 8. Anterior fontanelle (bregma) closes 18–24 months; posterior fontanelle (lambda) by 2–3 months.',
    clinical: 'The PTERION — where frontal, parietal, sphenoid and temporal meet — is the thinnest part of the vault and overlies the anterior division of the middle meningeal artery. Trauma here causes EXTRADURAL HAEMATOMA with the classic lucid interval and a biconvex (lens-shaped) CT collection.',
  },
  {
    id: 'occipital', name: 'Occipital Bone', latin: 'Os occipitale',
    region: 'skull', group: 'Neurocranium', type: 'Flat bone', count: 1, paired: false,
    desc: 'Forms the posterior cranium and most of the posterior cranial fossa. Encircles the foramen magnum with a squamous part, two lateral (condylar) parts and a basilar part.',
    landmarks: ['Foramen magnum', 'Occipital condyles', 'External occipital protuberance (inion)', 'Superior and inferior nuchal lines', 'Internal occipital protuberance and cruciform eminence', 'Hypoglossal canal', 'Condylar canal', 'Basilar part (clivus)', 'Grooves for transverse and sigmoid sinuses'],
    articulations: ['Parietals (lambdoid suture)', 'Temporals (occipitomastoid suture)', 'Sphenoid (spheno-occipital synchondrosis)', 'Atlas — C1 (atlanto-occipital joints)'],
    muscles: ['Trapezius', 'Sternocleidomastoid', 'Splenius capitis', 'Semispinalis capitis', 'Rectus capitis posterior major/minor', 'Obliquus capitis superior', 'Longus capitis', 'Rectus capitis anterior/lateralis'],
    ossify: 'Mixed — squamous part above the highest nuchal line is intramembranous; the rest is endochondral, from 6 centres. Spheno-occipital synchondrosis fuses at 18–25 years, a useful forensic age marker.',
    clinical: 'The foramen magnum transmits the medulla, vertebral arteries and spinal accessory nerve roots. Raised intracranial pressure drives TONSILLAR HERNIATION (coning) through it — a terminal event. Occipital condyle fractures follow high-energy axial loading and may injure CN IX–XII.',
  },
  {
    id: 'temporal', name: 'Temporal Bone', latin: 'Os temporale',
    region: 'skull', group: 'Neurocranium', type: 'Irregular bone', count: 2, paired: true,
    desc: 'The most complex bone of the skull. Houses the entire organ of hearing and balance. Composed of squamous, petrous, mastoid, tympanic and styloid parts fused into one.',
    landmarks: ['Zygomatic process', 'Mandibular fossa and articular tubercle', 'External acoustic meatus', 'Mastoid process and air cells', 'Styloid process', 'Petrous part (houses inner ear)', 'Internal acoustic meatus', 'Stylomastoid foramen', 'Carotid canal', 'Jugular fossa', 'Facial canal'],
    articulations: ['Parietal (squamous suture)', 'Occipital', 'Sphenoid', 'Zygomatic (zygomatic arch)', 'Mandible (temporomandibular joint)'],
    muscles: ['Sternocleidomastoid (mastoid)', 'Splenius capitis', 'Longissimus capitis', 'Digastric — posterior belly (mastoid notch)', 'Stylohyoid, styloglossus, stylopharyngeus (styloid process)', 'Temporalis (deep surface of zygomatic arch)', 'Masseter (lower border of arch)'],
    ossify: 'Petrous and mastoid parts endochondral; squamous and tympanic parts intramembranous. The mastoid process is absent at birth and only develops from ~2 years as the child holds the head up.',
    clinical: 'The FACIAL NERVE (CN VII) runs through the facial canal — temporal bone fracture or mastoid surgery risks a lower-motor-neuron facial palsy. Because the mastoid is unformed in infants, the superficial facial nerve is vulnerable in neonatal forceps delivery. Battle sign (mastoid ecchymosis) indicates a base-of-skull fracture.',
  },
  {
    id: 'sphenoid', name: 'Sphenoid Bone', latin: 'Os sphenoidale',
    region: 'skull', group: 'Neurocranium', type: 'Irregular bone', count: 1, paired: false,
    desc: 'The "keystone" of the cranial base — the only bone articulating with all other cranial bones. Butterfly-shaped, with a central body, greater and lesser wings and two pterygoid processes.',
    landmarks: ['Sella turcica and hypophyseal fossa', 'Anterior and posterior clinoid processes', 'Optic canal', 'Superior orbital fissure', 'Foramen rotundum (V2)', 'Foramen ovale (V3)', 'Foramen spinosum (middle meningeal a.)', 'Pterygoid canal', 'Medial and lateral pterygoid plates', 'Pterygoid hamulus', 'Sphenoidal sinus', 'Carotid (cavernous) groove'],
    articulations: ['Frontal', 'Parietals', 'Temporals', 'Occipital', 'Ethmoid', 'Vomer', 'Zygomatics', 'Palatines', 'Maxillae'],
    muscles: ['Lateral pterygoid (both heads)', 'Medial pterygoid (lateral pterygoid plate)', 'Temporalis', 'Superior constrictor (pterygomandibular raphe)', 'Tensor veli palatini (scaphoid fossa)', 'All extraocular recti (via common tendinous ring)'],
    ossify: 'Endochondral from multiple centres. The sphenoidal sinus is a pneumatised extension of the body, poorly developed before age 7.',
    clinical: 'The PITUITARY GLAND sits in the sella turcica — adenomas expand superiorly and compress the optic chiasm, producing BITEMPORAL HEMIANOPIA. Trans-sphenoidal hypophysectomy reaches the gland through the nose and sphenoidal sinus. The cavernous sinus flanks the body carrying CN III, IV, V1, V2, VI and the internal carotid artery.',
  },
  {
    id: 'ethmoid', name: 'Ethmoid Bone', latin: 'Os ethmoidale',
    region: 'skull', group: 'Neurocranium', type: 'Irregular bone', count: 1, paired: false,
    desc: 'A light, cuboidal, cancellous bone between the orbits forming the roof of the nasal cavity, part of the medial orbital wall and the upper nasal septum.',
    landmarks: ['Cribriform plate', 'Crista galli', 'Perpendicular plate (upper nasal septum)', 'Ethmoidal labyrinth / air cells', 'Superior and middle nasal conchae', 'Orbital plate (lamina papyracea)', 'Uncinate process', 'Ethmoidal bulla'],
    articulations: ['Frontal', 'Sphenoid', 'Nasal bones', 'Maxillae', 'Lacrimal bones', 'Palatines', 'Vomer', 'Inferior nasal conchae'],
    muscles: ['None (no direct muscular attachment)'],
    ossify: 'Endochondral from the nasal capsule; three centres. Perpendicular plate ossifies in the first year; the whole bone unites by the second year.',
    clinical: 'The OLFACTORY NERVE filaments pierce the cribriform plate — a fracture here shears them causing ANOSMIA and CSF rhinorrhoea. The lamina papyracea is paper-thin, so ethmoid sinusitis in children spreads readily into the orbit producing ORBITAL CELLULITIS.',
  },

  /* ==============================================================
   * VISCEROCRANIUM — 14 bones
   * ============================================================== */
  {
    id: 'maxilla', name: 'Maxilla', latin: 'Maxilla',
    region: 'skull', group: 'Viscerocranium', type: 'Irregular bone', count: 2, paired: true,
    desc: 'The paired upper jaw bones form the skeleton of the mid-face: the floor and lateral wall of the nose, the floor of the orbit, the anterior hard palate and the upper dental arch.',
    landmarks: ['Body with maxillary sinus (antrum of Highmore)', 'Frontal process', 'Zygomatic process', 'Alveolar process (upper teeth)', 'Palatine process', 'Infraorbital foramen and groove', 'Canine fossa', 'Anterior nasal spine', 'Incisive fossa/foramen', 'Maxillary tuberosity'],
    articulations: ['Opposite maxilla (intermaxillary suture)', 'Frontal', 'Ethmoid', 'Nasal', 'Lacrimal', 'Zygomatic', 'Palatine', 'Vomer', 'Inferior nasal concha'],
    muscles: ['Levator labii superioris', 'Levator anguli oris', 'Zygomaticus minor', 'Nasalis', 'Depressor septi nasi', 'Buccinator', 'Orbicularis oris', 'Medial pterygoid (tuberosity)', 'Inferior oblique (orbital floor)'],
    ossify: 'Intramembranous, two centres. The maxillary sinus is the first paranasal sinus to appear (week 16 in utero) and is fully pneumatised only after the permanent teeth erupt.',
    clinical: 'LE FORT FRACTURES classify mid-face trauma: Le Fort I (floating palate, transverse above teeth), Le Fort II (pyramidal, through orbital floor), Le Fort III (craniofacial disjunction). Maxillary sinus roots of the upper molars can project into the antrum — extraction may create an oro-antral fistula. Infraorbital nerve (V2) blocks are given at the infraorbital foramen.',
  },
  {
    id: 'mandible', name: 'Mandible', latin: 'Mandibula',
    region: 'skull', group: 'Viscerocranium', type: 'Irregular bone', count: 1, paired: false,
    desc: 'The lower jaw — the largest, strongest and only mobile bone of the skull. A horizontal body carrying the lower teeth, with two vertical rami bearing condylar and coronoid processes.',
    landmarks: ['Body and mental protuberance (chin)', 'Mental foramen', 'Ramus', 'Angle of mandible (gonion)', 'Condylar process and head', 'Coronoid process', 'Mandibular notch', 'Mandibular foramen and lingula', 'Mylohyoid line and groove', 'Genial tubercles (mental spines)', 'Submandibular and sublingual fossae', 'Alveolar part'],
    articulations: ['Temporal bones — temporomandibular joint (TMJ), a bilateral synovial joint with an articular disc'],
    muscles: ['Masseter (angle/ramus)', 'Temporalis (coronoid process)', 'Medial pterygoid (medial angle)', 'Lateral pterygoid (condylar neck/pterygoid fovea)', 'Mylohyoid', 'Geniohyoid', 'Genioglossus', 'Digastric — anterior belly', 'Buccinator', 'Mentalis', 'Depressor labii inferioris', 'Depressor anguli oris', 'Platysma'],
    ossify: 'Intramembranous around Meckel\'s cartilage (1st pharyngeal arch). Two halves fuse at the mandibular symphysis in the first year of life.',
    clinical: 'INFERIOR ALVEOLAR NERVE BLOCK targets the mandibular foramen — the workhorse of dentistry. The mandible commonly fractures in two places (a "ring bone"): always look for a second fracture. Condylar neck is the weakest point. ANTERIOR TMJ DISLOCATION locks the jaw open; reduction is downward-then-backward pressure on the molars. Bilateral fracture of the body risks airway loss from posterior tongue displacement.',
  },
  {
    id: 'zygomatic', name: 'Zygomatic Bone', latin: 'Os zygomaticum',
    region: 'skull', group: 'Viscerocranium', type: 'Irregular bone', count: 2, paired: true,
    desc: 'The cheekbone. Forms the prominence of the cheek, the lateral orbital wall and rim, and — with the temporal bone — the zygomatic arch.',
    landmarks: ['Frontal process', 'Temporal process (forms zygomatic arch)', 'Maxillary process', 'Orbital surface', 'Zygomaticofacial foramen', 'Zygomaticotemporal foramen', 'Whitnall (orbital) tubercle'],
    articulations: ['Frontal', 'Sphenoid (greater wing)', 'Temporal', 'Maxilla'],
    muscles: ['Zygomaticus major and minor', 'Masseter (lateral surface / arch)', 'Levator labii superioris alaeque nasi (adjacent)', 'Orbicularis oculi', 'Temporal fascia attachment'],
    ossify: 'Intramembranous, one centre in week 8.',
    clinical: 'ZYGOMATIC COMPLEX ("tripod") FRACTURE is the second commonest facial fracture after nasal. Signs: flattened cheek, step deformity at the orbital rim, infraorbital paraesthesia, trismus (depressed arch blocks the coronoid process), and diplopia if the orbital floor blows out.',
  },
  {
    id: 'nasal', name: 'Nasal Bone', latin: 'Os nasale',
    region: 'skull', group: 'Viscerocranium', type: 'Flat bone', count: 2, paired: true,
    desc: 'Small oblong plates forming the bony bridge of the nose. The lower part of the nose is cartilage, not bone.',
    landmarks: ['Nasion (midline suture with frontal)', 'Rhinion (lower free end)', 'Internasal suture', 'Nasal foramen'],
    articulations: ['Frontal', 'Opposite nasal', 'Maxilla (frontal process)', 'Perpendicular plate of ethmoid'],
    muscles: ['Procerus (superficial)', 'Nasalis (partly)'],
    ossify: 'Intramembranous, one centre each, week 8.',
    clinical: 'The MOST COMMONLY FRACTURED FACIAL BONE. Assess for septal haematoma — if missed it causes avascular necrosis of the septal cartilage and a SADDLE-NOSE DEFORMITY. Manipulation is best performed within 10–14 days before callus sets.',
  },
  {
    id: 'lacrimal', name: 'Lacrimal Bone', latin: 'Os lacrimale',
    region: 'skull', group: 'Viscerocranium', type: 'Flat bone', count: 2, paired: true,
    desc: 'The smallest and most fragile bone of the face — a thin scale in the anterior part of the medial orbital wall.',
    landmarks: ['Posterior lacrimal crest', 'Lacrimal groove/fossa for the lacrimal sac', 'Lacrimal hamulus'],
    articulations: ['Frontal', 'Ethmoid', 'Maxilla', 'Inferior nasal concha'],
    muscles: ['Lacrimal part of orbicularis oculi (Horner muscle)'],
    ossify: 'Intramembranous, single centre in week 12.',
    clinical: 'Forms the lacrimal fossa housing the lacrimal sac; the nasolacrimal duct runs from here to the inferior meatus. Dacryocystorhinostomy (DCR) creates a window through this bone to bypass a blocked duct.',
  },
  {
    id: 'palatine', name: 'Palatine Bone', latin: 'Os palatinum',
    region: 'skull', group: 'Viscerocranium', type: 'Irregular bone', count: 2, paired: true,
    desc: 'An L-shaped bone deep in the face, forming the posterior third of the hard palate, part of the lateral nasal wall and a small part of the orbital floor.',
    landmarks: ['Horizontal plate (posterior hard palate)', 'Perpendicular plate', 'Pyramidal process', 'Orbital and sphenoidal processes', 'Greater and lesser palatine foramina', 'Posterior nasal spine'],
    articulations: ['Maxilla', 'Sphenoid', 'Ethmoid', 'Vomer', 'Inferior nasal concha', 'Opposite palatine'],
    muscles: ['Musculus uvulae', 'Levator veli palatini (aponeurosis)', 'Tensor veli palatini (aponeurosis)', 'Superior constrictor'],
    ossify: 'Intramembranous, single centre.',
    clinical: 'Failure of fusion of the palatine processes produces CLEFT PALATE (posterior/secondary palate), distinct from cleft lip (primary palate). Greater palatine nerve block is placed at the greater palatine foramen, medial to the third molar.',
  },
  {
    id: 'inferiorconcha', name: 'Inferior Nasal Concha', latin: 'Concha nasalis inferior',
    region: 'skull', group: 'Viscerocranium', type: 'Irregular bone', count: 2, paired: true,
    desc: 'A separate scroll-like bone on the lateral nasal wall — unlike the superior and middle conchae, which are parts of the ethmoid.',
    landmarks: ['Lacrimal process', 'Maxillary process', 'Ethmoidal process', 'Overhangs the inferior meatus'],
    articulations: ['Maxilla', 'Lacrimal', 'Ethmoid', 'Palatine'],
    muscles: ['None'],
    ossify: 'Endochondral from the nasal capsule, one centre in week 20.',
    clinical: 'The NASOLACRIMAL DUCT opens beneath it into the inferior meatus — hence a watering eye when the nose is blocked. Turbinate hypertrophy from allergic rhinitis is a common cause of nasal obstruction and may be surgically reduced.',
  },
  {
    id: 'vomer', name: 'Vomer', latin: 'Vomer',
    region: 'skull', group: 'Viscerocranium', type: 'Flat bone', count: 1, paired: false,
    desc: 'A thin unpaired ploughshare-shaped plate forming the posteroinferior part of the bony nasal septum.',
    landmarks: ['Alae (wings) that grip the sphenoid rostrum', 'Groove for the nasopalatine nerve and vessels', 'Posterior free border separating the choanae'],
    articulations: ['Sphenoid', 'Ethmoid (perpendicular plate)', 'Maxillae', 'Palatines', 'Septal cartilage'],
    muscles: ['None'],
    ossify: 'Intramembranous from two plates that fuse around puberty.',
    clinical: 'Deviation of the vomer/septum is extremely common and causes unilateral nasal obstruction; corrected by septoplasty. The vomer is a landmark for the posterior choanae in choanal atresia repair.',
  },

  /* ==============================================================
   * AUDITORY OSSICLES — 6 bones
   * ============================================================== */
  {
    id: 'malleus', name: 'Malleus', latin: 'Malleus',
    region: 'ossicles', group: 'Middle Ear', type: 'Irregular bone', count: 2, paired: true,
    desc: 'The "hammer" — the largest and most lateral auditory ossicle, embedded in the tympanic membrane.',
    landmarks: ['Head', 'Neck', 'Handle (manubrium)', 'Anterior process', 'Lateral process'],
    articulations: ['Tympanic membrane (handle)', 'Incus (incudomallear joint — saddle-type synovial)'],
    muscles: ['Tensor tympani (inserts on the handle) — innervated by V3'],
    ossify: 'Endochondral from Meckel\'s cartilage (1st pharyngeal arch). Adult size at birth — ossicles do not grow after birth.',
    clinical: 'The handle and lateral process are the landmarks seen on otoscopy. Tensor tympani contracts in the ACOUSTIC REFLEX to dampen loud sound. Ossicular chain discontinuity causes conductive hearing loss with a large air–bone gap.',
  },
  {
    id: 'incus', name: 'Incus', latin: 'Incus',
    region: 'ossicles', group: 'Middle Ear', type: 'Irregular bone', count: 2, paired: true,
    desc: 'The "anvil" — the middle ossicle, shaped like a two-rooted premolar tooth.',
    landmarks: ['Body', 'Short (horizontal) limb', 'Long (vertical) limb', 'Lenticular process'],
    articulations: ['Malleus (incudomallear joint)', 'Stapes (incudostapedial joint)'],
    muscles: ['None'],
    ossify: 'Endochondral, 1st pharyngeal arch (Meckel\'s cartilage). Fully formed by mid-gestation.',
    clinical: 'The LONG PROCESS has the most tenuous blood supply of any ossicle and is the commonest site of NECROSIS in chronic otitis media, producing conductive deafness. Repaired by ossiculoplasty.',
  },
  {
    id: 'stapes', name: 'Stapes', latin: 'Stapes',
    region: 'ossicles', group: 'Middle Ear', type: 'Irregular bone', count: 2, paired: true,
    desc: 'The "stirrup" — the SMALLEST BONE IN THE HUMAN BODY (~3 mm, 2–4 mg). Its footplate seals the oval window.',
    landmarks: ['Head', 'Anterior and posterior crura', 'Base (footplate) in the oval window', 'Annular ligament'],
    articulations: ['Incus (incudostapedial joint)', 'Oval window of the vestibule (via annular ligament)'],
    muscles: ['Stapedius (inserts on the neck) — SMALLEST SKELETAL MUSCLE, innervated by CN VII'],
    ossify: 'Endochondral from Reichert\'s cartilage (2nd pharyngeal arch).',
    clinical: 'OTOSCLEROSIS fixes the footplate to the oval window causing progressive conductive hearing loss in young adults, classically worse in pregnancy; treated by STAPEDECTOMY with a prosthesis. Stapedius paralysis in Bell palsy causes HYPERACUSIS.',
  },

  /* ==============================================================
   * HYOID
   * ============================================================== */
  {
    id: 'hyoid', name: 'Hyoid Bone', latin: 'Os hyoideum',
    region: 'hyoid', group: 'Neck', type: 'Irregular bone', count: 1, paired: false,
    desc: 'A U-shaped bone in the anterior neck at the C3 level. UNIQUE — it articulates with NO other bone, suspended by muscles and the stylohyoid ligaments.',
    landmarks: ['Body', 'Greater horns (cornua)', 'Lesser horns'],
    articulations: ['None — suspended by ligaments and muscle. Attached to the thyroid cartilage by the thyrohyoid membrane.'],
    muscles: ['Suprahyoid: mylohyoid, geniohyoid, stylohyoid, digastric', 'Infrahyoid: sternohyoid, omohyoid, thyrohyoid', 'Also: hyoglossus, middle constrictor'],
    ossify: 'Endochondral from 2nd (lesser horn) and 3rd (greater horn/body) pharyngeal arch cartilages; 6 centres, fusion after 40 years.',
    clinical: 'FRACTURE OF THE HYOID is near-pathognomonic for MANUAL STRANGULATION and is specifically sought at autopsy. It anchors the tongue — hyoid suspension is used surgically in obstructive sleep apnoea. Elevation of the hyoid is essential for the swallow reflex.',
  },

  /* ==============================================================
   * VERTEBRAL COLUMN — 26 bones
   * ============================================================== */
  {
    id: 'atlas', name: 'Atlas (C1)', latin: 'Atlas',
    region: 'vertebral', group: 'Cervical Spine', type: 'Irregular bone', count: 1, paired: false,
    desc: 'The first cervical vertebra. A ring with NO BODY and NO SPINOUS PROCESS — it carries the skull, named for the Titan who bore the heavens.',
    landmarks: ['Anterior arch with anterior tubercle', 'Posterior arch with posterior tubercle', 'Lateral masses', 'Superior articular facets (concave, kidney-shaped)', 'Inferior articular facets', 'Transverse foramina', 'Groove for vertebral artery', 'Facet for the dens on the anterior arch'],
    articulations: ['Occipital condyles (atlanto-occipital joint — "YES" joint, flexion/extension)', 'Axis C2 (atlanto-axial joints — "NO" joint, rotation)'],
    muscles: ['Rectus capitis anterior/lateralis', 'Obliquus capitis superior and inferior', 'Longus colli', 'Levator scapulae', 'Splenius cervicis'],
    ossify: 'Three centres — anterior arch (appears in year 1) and two lateral masses (7th fetal week). Posterior arch fuses by 3–4 years, anterior by 5–9 years.',
    clinical: 'JEFFERSON FRACTURE — a burst fracture of the C1 ring from axial loading (diving into shallow water). Because the ring bursts outward it is often neurologically intact, but check the transverse ligament: the RULE OF SPENCE says combined lateral mass overhang >7 mm on an open-mouth peg view implies ligamentous rupture and instability.',
  },
  {
    id: 'axis', name: 'Axis (C2)', latin: 'Axis',
    region: 'vertebral', group: 'Cervical Spine', type: 'Irregular bone', count: 1, paired: false,
    desc: 'The second cervical vertebra, distinguished by the DENS (odontoid process) projecting up from the body — the pivot about which the atlas and skull rotate.',
    landmarks: ['Dens (odontoid process) with anterior and posterior articular facets', 'Body', 'Bifid spinous process', 'Superior and inferior articular facets', 'Transverse foramina', 'Pedicles and laminae (pars interarticularis)'],
    articulations: ['Atlas C1 (median and lateral atlanto-axial joints)', 'C3 vertebra'],
    muscles: ['Obliquus capitis inferior', 'Rectus capitis posterior major', 'Semispinalis cervicis', 'Levator scapulae', 'Longus colli', 'Splenius cervicis'],
    ossify: 'Five primary centres. The dens is a phylogenetic remnant of the C1 body. Dens–body synchondrosis fuses at 3–6 years — DO NOT mistake it for a fracture in a child.',
    clinical: 'ODONTOID PEG FRACTURES (Anderson–D\'Alonzo): Type I tip (stable), Type II base of dens (COMMONEST and highest non-union risk — poor blood supply), Type III into the body (usually heals). HANGMAN FRACTURE = bilateral pars interarticularis fracture (traumatic spondylolisthesis of C2) from hyperextension–distraction. The transverse ligament of the atlas holds the dens — its rupture in RHEUMATOID ARTHRITIS or Down syndrome causes atlanto-axial subluxation and cord compression.',
  },
  {
    id: 'cervical', name: 'Cervical Vertebrae (C3–C7)', latin: 'Vertebrae cervicales',
    region: 'vertebral', group: 'Cervical Spine', type: 'Irregular bone', count: 5, paired: false,
    desc: 'Typical cervical vertebrae — small bodies, large triangular vertebral foramina, and the defining TRANSVERSE FORAMINA that transmit the vertebral arteries. C7 is the vertebra prominens.',
    landmarks: ['Transverse foramen (unique to cervical)', 'Bifid spinous process (C3–C6)', 'Uncinate processes (uncovertebral joints of Luschka)', 'Anterior and posterior tubercles of transverse process', 'Carotid tubercle (C6 anterior tubercle)', 'Vertebra prominens (C7 — long non-bifid spine)', 'Triangular vertebral foramen'],
    articulations: ['Adjacent vertebrae via intervertebral discs and paired zygapophysial (facet) joints', 'Uncovertebral joints'],
    muscles: ['Scalenes (anterior, middle, posterior)', 'Longus colli and capitis', 'Levator scapulae', 'Splenius cervicis', 'Semispinalis', 'Multifidus', 'Trapezius (C7 spine)', 'Rhomboid minor (C7)'],
    ossify: 'Three primary centres (body + two neural arch halves); five secondary centres at puberty, fusing by 25 years.',
    clinical: 'The VERTEBRAL ARTERY ascends through C6–C1 transverse foramina — it may be injured in cervical fracture or manipulation, causing posterior circulation stroke. C6 carotid tubercle (Chassaignac) is the landmark for carotid compression and stellate ganglion block. Cervical spondylosis with uncovertebral osteophytes narrows the intervertebral foramen causing RADICULOPATHY. NB: cervical nerve roots exit ABOVE their numbered vertebra (C6 root above C6), with C8 emerging between C7 and T1.',
  },
  {
    id: 'thoracicvert', name: 'Thoracic Vertebrae (T1–T12)', latin: 'Vertebrae thoracicae',
    region: 'vertebral', group: 'Thoracic Spine', type: 'Irregular bone', count: 12, paired: false,
    desc: 'Twelve vertebrae defined by COSTAL FACETS for the ribs. Heart-shaped bodies, long inferiorly-sloping spinous processes and a circular vertebral foramen. The primary kyphotic curve.',
    landmarks: ['Superior and inferior costal demifacets (body)', 'Transverse costal facet (T1–T10)', 'Long, sharply downward-angled spinous process', 'Circular vertebral foramen', 'Coronally-oriented facet joints (permit rotation)'],
    articulations: ['Ribs — costovertebral joints (head of rib) and costotransverse joints (tubercle of rib)', 'Adjacent vertebrae via discs and facet joints'],
    muscles: ['Erector spinae (iliocostalis, longissimus, spinalis)', 'Semispinalis thoracis', 'Multifidus', 'Rotatores', 'Trapezius', 'Rhomboids', 'Latissimus dorsi', 'Serratus posterior superior/inferior'],
    ossify: 'Three primary centres; ring apophyses of the vertebral body appear at puberty and fuse at ~25 years.',
    clinical: 'The thoracic canal is NARROWEST here and the cord blood supply is watershed at T4–T9 — thoracic disc disease or metastasis causes CORD COMPRESSION (an oncological emergency: dexamethasone + urgent MRI whole spine). OSTEOPOROTIC WEDGE FRACTURES here produce the dowager hump. The ARTERY OF ADAMKIEWICZ usually arises T9–T12 on the left — at risk in aortic surgery, causing anterior spinal artery syndrome.',
  },
  {
    id: 'lumbar', name: 'Lumbar Vertebrae (L1–L5)', latin: 'Vertebrae lumbales',
    region: 'vertebral', group: 'Lumbar Spine', type: 'Irregular bone', count: 5, paired: false,
    desc: 'The five largest movable vertebrae — massive kidney-shaped bodies built for weight-bearing, with short blunt hatchet-shaped spinous processes and sagittally oriented facets.',
    landmarks: ['Large kidney-shaped body', 'Short thick pedicles', 'Hatchet-shaped spinous process (horizontal)', 'Transverse (costal) processes', 'Mamillary and accessory processes', 'Pars interarticularis', 'Triangular vertebral foramen', 'Sagittal facet joints (block rotation, allow flexion/extension)'],
    articulations: ['Adjacent vertebrae', 'L5 with the sacrum (lumbosacral joint)', 'T12 above'],
    muscles: ['Psoas major (bodies and transverse processes)', 'Quadratus lumborum', 'Erector spinae', 'Multifidus', 'Latissimus dorsi (via thoracolumbar fascia)', 'Diaphragm crura (L1–L3)'],
    ossify: 'Three primary centres plus five secondary; complete fusion by 25 years.',
    clinical: 'LUMBAR PUNCTURE is performed at L3/L4 or L4/L5 (Tuffier line = intercristal line at L4) because the SPINAL CORD ENDS AT L1/L2 in adults. DISC PROLAPSE is commonest at L4/L5 and L5/S1 — a posterolateral prolapse spares the exiting root and hits the TRAVERSING root (L4/L5 disc → L5 root). SPONDYLOLYSIS is a pars interarticularis defect (Scottie-dog collar sign on oblique X-ray); bilateral defects allow SPONDYLOLISTHESIS. CAUDA EQUINA SYNDROME — saddle anaesthesia, bladder dysfunction, bilateral sciatica — is a surgical emergency.',
  },
  {
    id: 'sacrum', name: 'Sacrum', latin: 'Os sacrum',
    region: 'vertebral', group: 'Sacrum & Coccyx', type: 'Irregular bone', count: 1, paired: false,
    desc: 'A large triangular bone formed by fusion of five sacral vertebrae (S1–S5). Wedged between the hip bones, it transmits the entire weight of the upper body to the pelvis.',
    landmarks: ['Base and sacral promontory', 'Ala (wing)', 'Anterior and posterior sacral foramina (4 pairs each)', 'Median, intermediate and lateral sacral crests', 'Sacral canal and sacral hiatus', 'Sacral cornua', 'Auricular surface (for the ilium)', 'Sacral tuberosity', 'Apex'],
    articulations: ['L5 vertebra (lumbosacral joint)', 'Ilium bilaterally (sacroiliac joints — part synovial, part syndesmosis)', 'Coccyx (sacrococcygeal joint)'],
    muscles: ['Piriformis (anterior surface)', 'Erector spinae / multifidus (posterior)', 'Gluteus maximus', 'Coccygeus', 'Iliacus (partly)'],
    ossify: 'Each segment has 3 primary centres. Fusion begins ~16 years inferiorly and completes 25–30 years superiorly.',
    clinical: 'CAUDAL EPIDURAL ANAESTHESIA is delivered through the sacral hiatus between the sacral cornua — widely used in paediatric and obstetric practice. The SACRAL PROMONTORY is the key landmark for the pelvic inlet in obstetric pelvimetry. SEX DIFFERENCE: the female sacrum is shorter, wider and less curved. Sacral insufficiency fractures are an under-diagnosed cause of back pain in osteoporotic elderly patients.',
  },
  {
    id: 'coccyx', name: 'Coccyx', latin: 'Os coccygis',
    region: 'vertebral', group: 'Sacrum & Coccyx', type: 'Irregular bone', count: 1, paired: false,
    desc: 'The tailbone — a small triangular bone of 3–5 fused rudimentary vertebrae, the vestigial human tail.',
    landmarks: ['Coccygeal cornua (articulate with sacral cornua)', 'Transverse processes of Co1', 'Apex'],
    articulations: ['Sacrum (sacrococcygeal symphysis — fibrocartilaginous)'],
    muscles: ['Coccygeus', 'Levator ani (iliococcygeus)', 'Gluteus maximus (some fibres)', 'External anal sphincter (anococcygeal body)'],
    ossify: 'One centre per segment, appearing from birth to 20 years; segments fuse progressively, and the coccyx may fuse with the sacrum in later life.',
    clinical: 'COCCYDYNIA follows a fall onto the buttocks or childbirth; managed conservatively with a ring cushion, and rarely by coccygectomy. The coccyx retroverts during the second stage of labour to enlarge the pelvic outlet. It is an attachment point for the pelvic floor — relevant to prolapse and continence.',
  },

  /* ==============================================================
   * THORACIC CAGE — 25 bones
   * ============================================================== */
  {
    id: 'sternum', name: 'Sternum', latin: 'Sternum',
    region: 'thoracic', group: 'Thoracic Cage', type: 'Flat bone', count: 1, paired: false,
    desc: 'The breastbone — a flat dagger-shaped bone in three parts: manubrium, body and xiphoid process. Anterior anchor of the thoracic cage.',
    landmarks: ['Manubrium', 'Jugular (suprasternal) notch', 'Clavicular notches', 'STERNAL ANGLE OF LOUIS (manubriosternal joint, T4/T5 level, 2nd costal cartilage)', 'Body (mesosternum)', 'Xiphoid process', 'Costal notches 1–7'],
    articulations: ['Clavicles (sternoclavicular joints)', 'Costal cartilages of ribs 1–7 (sternocostal joints)', 'Manubriosternal and xiphisternal symphyses'],
    muscles: ['Pectoralis major', 'Sternocleidomastoid', 'Sternohyoid', 'Sternothyroid', 'Transversus thoracis', 'Rectus abdominis (xiphoid)', 'Diaphragm (xiphoid, sternal part)'],
    ossify: 'Endochondral from sternebrae. Xiphoid ossifies around 40 years. Manubriosternal joint may fuse after 30.',
    clinical: 'The STERNAL ANGLE is the single most useful surface landmark of the thorax: level of the 2nd costal cartilage (start rib counting here), the T4/T5 disc, the aortic arch start and end, the tracheal bifurcation, and the thoracic duct crossover. STERNOTOMY is the standard cardiac surgical approach. INTRAOSSEOUS ACCESS via the manubrium is a recognised emergency route. Avoid the xiphoid in CPR hand placement — it can fracture and lacerate the liver.',
  },
  {
    id: 'ribs', name: 'Ribs (1–12)', latin: 'Costae',
    region: 'thoracic', group: 'Thoracic Cage', type: 'Flat bone', count: 24, paired: true,
    desc: 'Twelve pairs of curved flat bones. Ribs 1–7 are TRUE (vertebrosternal, own costal cartilage to sternum), 8–10 are FALSE (vertebrochondral, joining the cartilage above), 11–12 are FLOATING (vertebral, no anterior attachment).',
    landmarks: ['Head with two facets and interarticular crest', 'Neck', 'Tubercle (articular + non-articular parts)', 'Angle', 'Shaft/body', 'COSTAL GROOVE on inferior border (carries intercostal Vein, Artery, Nerve — "VAN", superior to inferior)', 'Rib 1: scalene tubercle, grooves for subclavian artery and vein'],
    articulations: ['Thoracic vertebral bodies (costovertebral joints)', 'Transverse processes T1–T10 (costotransverse joints)', 'Costal cartilage anteriorly'],
    muscles: ['External, internal and innermost intercostals', 'Serratus anterior', 'Pectoralis minor (ribs 3–5)', 'Scalenus anterior and medius (rib 1), posterior (rib 2)', 'Subcostals', 'Latissimus dorsi', 'Quadratus lumborum (rib 12)', 'Diaphragm (ribs 7–12)', 'External oblique'],
    ossify: 'One primary centre in the body plus secondary centres at the head and tubercle appearing at puberty, fusing by 25.',
    clinical: 'CHEST DRAIN INSERTION passes just ABOVE the upper border of the rib to avoid the neurovascular bundle in the costal groove — the "safe triangle" is bordered by latissimus dorsi, pectoralis major and the 5th intercostal space. FLAIL CHEST (≥3 consecutive ribs fractured in ≥2 places) produces paradoxical movement and underlying pulmonary contusion. Fractured ribs 9–12 on the left suggest SPLENIC rupture; on the right, HEPATIC injury. FIRST RIB is protected — its fracture indicates massive force, with risk to the subclavian vessels and brachial plexus. A CERVICAL RIB (extra rib on C7) causes THORACIC OUTLET SYNDROME.',
  },

  /* ==============================================================
   * PECTORAL GIRDLE — 4 bones
   * ============================================================== */
  {
    id: 'clavicle', name: 'Clavicle', latin: 'Clavicula',
    region: 'pectoral', group: 'Shoulder Girdle', type: 'Long bone', count: 2, paired: true,
    desc: 'The collarbone — an S-shaped strut that is the ONLY bony connection between the upper limb and the axial skeleton. Subcutaneous along its whole length. Uniquely, it is a long bone with NO MEDULLARY CAVITY.',
    landmarks: ['Sternal (medial) end — convex forward', 'Acromial (lateral) end — concave forward', 'Conoid tubercle', 'Trapezoid line', 'Subclavian groove (for subclavius)', 'Impression for the costoclavicular ligament'],
    articulations: ['Sternum (sternoclavicular joint — the only true joint between upper limb and axial skeleton, saddle-type with a disc)', 'Acromion of scapula (acromioclavicular joint — plane synovial)'],
    muscles: ['Deltoid (anterior lateral third)', 'Pectoralis major (anterior medial two-thirds)', 'Trapezius (posterior lateral third)', 'Sternocleidomastoid (superior medial)', 'Subclavius', 'Sternohyoid'],
    ossify: 'FIRST BONE IN THE BODY TO OSSIFY (week 5–6 in utero) and the LAST TO COMPLETE — the medial epiphysis fuses at 25 years, making it a valuable forensic age indicator. Ossifies intramembranously (with endochondral ends) — unique among long bones.',
    clinical: 'MOST COMMONLY FRACTURED BONE IN CHILDHOOD; usually at the junction of the middle and lateral thirds (weakest point). The medial fragment is pulled UP by sternocleidomastoid and the lateral fragment DOWN by the weight of the limb and pectoralis major. The subclavian vessels and brachial plexus lie beneath — always check distal pulses and neurology. CLEIDOCRANIAL DYSPLASIA (RUNX2 mutation) features absent/hypoplastic clavicles allowing the shoulders to be approximated in front of the chest.',
  },
  {
    id: 'scapula', name: 'Scapula', latin: 'Scapula',
    region: 'pectoral', group: 'Shoulder Girdle', type: 'Flat bone', count: 2, paired: true,
    desc: 'The shoulder blade — a triangular flat bone gliding on the posterior thoracic wall over ribs 2–7. It is held entirely by muscle (the scapulothoracic "joint" is not a true joint), giving the shoulder its huge range of motion.',
    landmarks: ['Spine of scapula', 'Acromion', 'Coracoid process', 'Glenoid cavity/fossa with supraglenoid and infraglenoid tubercles', 'Supraspinous and infraspinous fossae', 'Subscapular fossa', 'Superior, medial (vertebral) and lateral (axillary) borders', 'Superior, inferior and lateral angles', 'Suprascapular notch', 'Spinoglenoid notch'],
    articulations: ['Humerus (glenohumeral joint — ball and socket, most mobile joint in the body)', 'Clavicle (acromioclavicular joint)'],
    muscles: ['ROTATOR CUFF — supraspinatus, infraspinatus, teres minor, subscapularis ("SITS")', 'Deltoid (spine and acromion)', 'Trapezius', 'Rhomboid major and minor', 'Levator scapulae', 'Serratus anterior (medial border, costal surface)', 'Pectoralis minor (coracoid)', 'Biceps brachii — long head (supraglenoid tubercle), short head (coracoid)', 'Coracobrachialis (coracoid)', 'Triceps — long head (infraglenoid tubercle)', 'Teres major', 'Latissimus dorsi (inferior angle)', 'Omohyoid'],
    ossify: 'Endochondral, 7–8 centres. Body ossifies in week 8 in utero; coracoid at year 1; acromion and other secondary centres at puberty, fusing 18–25. A persistent unfused acromial centre = OS ACROMIALE (mimics fracture, associated with impingement).',
    clinical: 'WINGED SCAPULA results from LONG THORACIC NERVE (C5,6,7 — "wings of heaven") palsy paralysing serratus anterior; the medial border lifts off the chest wall on wall-push. Scapular fracture implies HIGH-ENERGY TRAUMA — look for associated rib, spine, lung and vascular injuries. The SUPRASCAPULAR NERVE passes through the suprascapular notch (under the ligament) and around the spinoglenoid notch — compression causes supraspinatus/infraspinatus wasting. The SURGICAL NECK of the humerus and the quadrangular space (axillary nerve) are related landmarks.',
  },

  /* ==============================================================
   * UPPER LIMB — 60 bones (30 per side)
   * ============================================================== */
  {
    id: 'humerus', name: 'Humerus', latin: 'Humerus',
    region: 'upperlimb', group: 'Arm', type: 'Long bone', count: 2, paired: true,
    desc: 'The single bone of the arm and the largest bone of the upper limb. Its proximal head forms the shoulder; distally the trochlea and capitulum form the elbow.',
    landmarks: ['Head', 'Anatomical neck', 'SURGICAL NECK', 'Greater tubercle (3 facets)', 'Lesser tubercle', 'Intertubercular (bicipital) groove', 'Deltoid tuberosity', 'RADIAL (SPIRAL) GROOVE', 'Medial and lateral epicondyles', 'Trochlea and capitulum', 'Coronoid, radial and olecranon fossae', 'Supracondylar ridges'],
    articulations: ['Scapula (glenohumeral joint)', 'Radius (radiocapitellar)', 'Ulna (humeroulnar — a hinge)'],
    muscles: ['Supraspinatus, infraspinatus, teres minor (greater tubercle)', 'Subscapularis (lesser tubercle)', 'Pectoralis major, latissimus dorsi, teres major (bicipital groove — "lady between two majors")', 'Deltoid (deltoid tuberosity)', 'Coracobrachialis', 'Brachialis', 'Triceps — lateral and medial heads', 'Brachioradialis and ECRL (lateral supracondylar ridge)', 'Common extensor origin (lateral epicondyle)', 'Common flexor origin (medial epicondyle)', 'Anconeus'],
    ossify: 'Endochondral. Eight centres. Proximal epiphysis contributes ~80% of humeral length and fuses LAST (18–20 years) — hence remodelling potential in children is excellent proximally. Distal centres: CRITOE order (Capitellum 1yr, Radial head 3, Internal/medial epicondyle 5, Trochlea 7, Olecranon 9, External/lateral epicondyle 11).',
    clinical: 'NERVE INJURY BY LEVEL: surgical neck fracture / anterior shoulder dislocation → AXILLARY NERVE (deltoid paralysis, "regimental badge" sensory loss, cannot abduct 15–90°). Mid-shaft fracture → RADIAL NERVE in the spiral groove (WRIST DROP, loss of extension). Supracondylar fracture (a classic paediatric injury from FOOSH) → MEDIAN NERVE, especially the anterior interosseous branch (cannot make an "OK" sign) and BRACHIAL ARTERY — risk of VOLKMANN ISCHAEMIC CONTRACTURE. Medial epicondyle fracture → ULNAR NERVE (claw hand). The CRITOE sequence is essential for reading paediatric elbow films.',
  },
  {
    id: 'radius', name: 'Radius', latin: 'Radius',
    region: 'upperlimb', group: 'Forearm', type: 'Long bone', count: 2, paired: true,
    desc: 'The LATERAL (thumb-side) forearm bone. It rotates about the ulna to produce pronation and supination, and carries the majority of the load across the wrist.',
    landmarks: ['Head (disc-shaped, articulates with capitulum)', 'Neck', 'Radial (bicipital) tuberosity', 'Interosseous border', 'Pronator tuberosity', 'Ulnar notch', 'Radial styloid process (extends ~1 cm DISTAL to the ulnar styloid)', 'Dorsal tubercle of Lister', 'Scaphoid and lunate facets'],
    articulations: ['Humerus — capitulum (radiocapitellar)', 'Ulna proximally (proximal radioulnar joint, held by the annular ligament) and distally (distal radioulnar joint)', 'Scaphoid and lunate (radiocarpal / wrist joint)'],
    muscles: ['Biceps brachii (radial tuberosity)', 'Supinator', 'Pronator teres (mid-lateral shaft)', 'Pronator quadratus (distal)', 'Flexor digitorum superficialis', 'Flexor pollicis longus', 'Brachioradialis (styloid process)', 'Abductor pollicis longus, extensor pollicis brevis'],
    ossify: 'Endochondral, three centres. Distal epiphysis appears at 1 year and fuses at 17–19 (the LAST to fuse in the forearm) — a standard bone-age site.',
    clinical: 'COLLES FRACTURE — distal radius fracture with DORSAL displacement from a FOOSH, giving the "dinner fork" deformity; the commonest fragility fracture in postmenopausal women. SMITH FRACTURE is the volar-displaced reverse. GALEAZZI FRACTURE = radial shaft fracture with distal radioulnar joint dislocation ("MUGR": Monteggia Ulna, Galeazzi Radius). The RADIAL STYLOID normally lies 1 cm distal to the ulnar — loss of this relationship signals impaction. Radial head fracture presents with painful, blocked supination.',
  },
  {
    id: 'ulna', name: 'Ulna', latin: 'Ulna',
    region: 'upperlimb', group: 'Forearm', type: 'Long bone', count: 2, paired: true,
    desc: 'The MEDIAL (little-finger side) forearm bone. It is the stabiliser of the elbow — its trochlear notch grips the humeral trochlea in a tight hinge — and it is subcutaneous along its whole posterior border.',
    landmarks: ['Olecranon (the point of the elbow)', 'Coronoid process', 'Trochlear (semilunar) notch', 'Radial notch', 'Ulnar tuberosity', 'Supinator crest', 'Interosseous border', 'Head (distal)', 'Ulnar styloid process'],
    articulations: ['Humerus — trochlea (humeroulnar joint)', 'Radius proximally and distally', 'NOT with the carpus directly — separated by the triangular fibrocartilage complex (TFCC)'],
    muscles: ['Triceps brachii (olecranon)', 'Brachialis (coronoid/ulnar tuberosity)', 'Anconeus', 'Pronator teres — ulnar head', 'Flexor carpi ulnaris', 'Flexor digitorum profundus', 'Flexor digitorum superficialis (ulnar head)', 'Supinator', 'Pronator quadratus', 'Extensor carpi ulnaris', 'Abductor pollicis longus, extensor pollicis longus, extensor indicis'],
    ossify: 'Endochondral, three centres. The olecranon secondary centre appears ~9 years (the "O" in CRITOE) and fuses at 16.',
    clinical: 'MONTEGGIA FRACTURE — proximal ulnar shaft fracture with RADIAL HEAD DISLOCATION; always draw a line through the radial head and neck: it must point at the capitellum in EVERY view. Olecranon fractures are displaced by triceps pull and usually need tension-band wiring. The ULNAR NERVE runs in the cubital tunnel behind the medial epicondyle — the "funny bone"; chronic compression causes cubital tunnel syndrome. NIGHTSTICK FRACTURE is an isolated ulnar shaft fracture from a direct defensive blow.',
  },
  {
    id: 'scaphoid', name: 'Scaphoid', latin: 'Os scaphoideum',
    region: 'upperlimb', group: 'Carpus (Proximal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'The largest bone of the proximal carpal row, boat-shaped, spanning both rows and acting as the mechanical link between them.',
    landmarks: ['Tubercle (palpable at the base of the thenar eminence)', 'Waist', 'Proximal and distal poles', 'Forms the floor of the ANATOMICAL SNUFFBOX'],
    articulations: ['Radius', 'Lunate', 'Capitate', 'Trapezium', 'Trapezoid'],
    muscles: ['Abductor pollicis brevis (tubercle)', 'Flexor retinaculum attachment', 'Scapholunate and radioscaphocapitate ligaments'],
    ossify: 'One centre, appearing at 4–6 years.',
    clinical: 'THE MOST COMMONLY FRACTURED CARPAL BONE (~70%), typically at the WAIST after a FOOSH. Its blood supply enters DISTALLY and runs RETROGRADE, so a proximal-pole fracture risks AVASCULAR NECROSIS and non-union. Tenderness in the ANATOMICAL SNUFFBOX with a normal initial X-ray must be treated as a fracture — immobilise and re-image or MRI at 10–14 days. Untreated it progresses to SNAC wrist (scaphoid non-union advanced collapse).',
  },
  {
    id: 'lunate', name: 'Lunate', latin: 'Os lunatum',
    region: 'upperlimb', group: 'Carpus (Proximal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'A crescent-moon-shaped carpal bone in the centre of the proximal row, articulating with the radius as the keystone of the wrist.',
    landmarks: ['Deeply concave distal surface for the capitate', 'Convex proximal surface for the radius', 'Trapezoidal on lateral view'],
    articulations: ['Radius', 'Scaphoid', 'Triquetrum', 'Capitate', 'Hamate'],
    muscles: ['No direct muscular attachment — ligamentous only (scapholunate, lunotriquetral)'],
    ossify: 'One centre at ~4 years.',
    clinical: 'THE MOST COMMONLY DISLOCATED CARPAL BONE. Lunate dislocation gives the "SPILLED TEACUP" sign on lateral X-ray and may compress the median nerve acutely. KIENBÖCK DISEASE is avascular necrosis of the lunate, associated with ulnar-negative variance, causing progressive wrist pain and collapse. On a normal lateral wrist film the radius, lunate and capitate must be COLINEAR.',
  },
  {
    id: 'triquetrum', name: 'Triquetrum', latin: 'Os triquetrum',
    region: 'upperlimb', group: 'Carpus (Proximal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'A pyramidal bone on the medial side of the proximal carpal row, carrying an isolated oval facet for the pisiform.',
    landmarks: ['Pyramidal body', 'Oval facet for pisiform (palmar surface)', 'Facet for the articular disc of the TFCC'],
    articulations: ['Lunate', 'Pisiform', 'Hamate', 'TFCC (not directly with the ulna)'],
    muscles: ['Ulnar collateral ligament', 'Flexor retinaculum (indirectly via pisiform)'],
    ossify: 'One centre at ~3 years — usually the SECOND carpal bone to ossify after the capitate/hamate.',
    clinical: 'The SECOND most commonly fractured carpal bone, usually a dorsal cortical chip avulsion visible only on the lateral or oblique view. Lunotriquetral ligament tears cause ulnar-sided wrist pain and a positive ballottement test.',
  },
  {
    id: 'pisiform', name: 'Pisiform', latin: 'Os pisiforme',
    region: 'upperlimb', group: 'Carpus (Proximal Row)', type: 'Sesamoid bone', count: 2, paired: true,
    desc: 'A pea-shaped SESAMOID bone within the tendon of flexor carpi ulnaris — the smallest carpal bone and the only one with a single articulation.',
    landmarks: ['Single flat facet for the triquetrum', 'Palpable at the base of the hypothenar eminence', 'Medial wall of Guyon canal'],
    articulations: ['Triquetrum only'],
    muscles: ['Flexor carpi ulnaris (inserts on it)', 'Abductor digiti minimi (arises from it)', 'Pisohamate and pisometacarpal ligaments', 'Flexor retinaculum attachment'],
    ossify: 'One centre, appearing LATE at 8–12 years — the LAST carpal to ossify.',
    clinical: 'Forms the medial boundary of GUYON CANAL — ULNAR NERVE compression here (from cycling, a ganglion, or a hook-of-hamate fracture) causes hypothenar wasting and clawing of the ring and little fingers WITHOUT sensory loss over the dorsum (the dorsal cutaneous branch leaves proximally) — the key discriminator from cubital tunnel syndrome.',
  },
  {
    id: 'trapezium', name: 'Trapezium', latin: 'Os trapezium',
    region: 'upperlimb', group: 'Carpus (Distal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'The most lateral bone of the distal carpal row, bearing the SADDLE-SHAPED facet that gives the human thumb its opposition — the anatomical basis of tool use.',
    landmarks: ['Saddle-shaped distal facet for the 1st metacarpal', 'Tubercle (crest) of trapezium', 'Groove for flexor carpi radialis tendon'],
    articulations: ['Scaphoid', 'Trapezoid', '1st metacarpal (first carpometacarpal — saddle joint)', '2nd metacarpal'],
    muscles: ['Abductor pollicis brevis', 'Flexor pollicis brevis', 'Opponens pollicis', 'Flexor retinaculum (lateral attachment)'],
    ossify: 'One centre at ~5–6 years.',
    clinical: 'The first CARPOMETACARPAL (CMC) joint is a classic site of OSTEOARTHRITIS, particularly in postmenopausal women — causing thumb-base pain, a positive grind test and eventual adduction deformity. Treated by splinting, injection, or trapeziectomy. The trapezial tubercle forms the lateral wall of the carpal tunnel.',
  },
  {
    id: 'trapezoid', name: 'Trapezoid', latin: 'Os trapezoideum',
    region: 'upperlimb', group: 'Carpus (Distal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'The smallest bone of the distal carpal row, wedge-shaped and firmly keyed between the trapezium and capitate.',
    landmarks: ['Wedge/boot shape — broad dorsally, narrow palmar', 'Articulates with the base of the 2nd metacarpal'],
    articulations: ['Scaphoid', 'Trapezium', 'Capitate', '2nd metacarpal'],
    muscles: ['Flexor pollicis brevis (some fibres)', 'Adductor pollicis (oblique head origin)'],
    ossify: 'One centre at ~6 years.',
    clinical: 'The LEAST COMMONLY FRACTURED and least commonly dislocated carpal bone, because it is deeply recessed and stabilised by strong ligaments on all sides. Isolated injury implies very high energy.',
  },
  {
    id: 'capitate', name: 'Capitate', latin: 'Os capitatum',
    region: 'upperlimb', group: 'Carpus (Distal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'THE LARGEST CARPAL BONE, occupying the centre of the wrist. Its rounded head sits in the concavity of the scaphoid and lunate — the axis about which the wrist moves.',
    landmarks: ['Head', 'Neck', 'Body', 'Central position — the wrist\'s axis of rotation'],
    articulations: ['Scaphoid', 'Lunate', 'Trapezoid', 'Hamate', '2nd, 3rd and 4th metacarpals (mainly the 3rd)'],
    muscles: ['Adductor pollicis (oblique head)', 'Flexor pollicis brevis (deep head)', 'Strong interosseous ligaments'],
    ossify: 'FIRST CARPAL BONE TO OSSIFY (1–3 months), followed by the hamate. Carpal ossification order is a standard paediatric bone-age assessment.',
    clinical: 'SCAPHOCAPITATE SYNDROME — a rare high-energy injury with fracture of both the scaphoid and the capitate, in which the capitate head rotates 180°. The capitate head has a retrograde blood supply and can undergo AVN. Its central position makes it the reference point for assessing carpal alignment (Gilula arcs).',
  },
  {
    id: 'hamate', name: 'Hamate', latin: 'Os hamatum',
    region: 'upperlimb', group: 'Carpus (Distal Row)', type: 'Short bone', count: 2, paired: true,
    desc: 'A wedge-shaped bone on the medial side of the distal row, distinguished by the HOOK (hamulus) projecting into the palm.',
    landmarks: ['HOOK OF HAMATE (hamulus)', 'Body', 'Facets for the 4th and 5th metacarpals', 'Medial wall of the carpal tunnel / lateral wall of Guyon canal'],
    articulations: ['Lunate', 'Triquetrum', 'Capitate', '4th and 5th metacarpals'],
    muscles: ['Flexor digiti minimi brevis', 'Opponens digiti minimi', 'Flexor retinaculum (medial attachment)', 'Pisohamate ligament'],
    ossify: 'One centre at 2–4 months (second to ossify after the capitate).',
    clinical: 'HOOK OF HAMATE FRACTURE occurs in golfers, baseball and racquet players from the butt of the club/bat. It is INVISIBLE on standard views — request a CARPAL TUNNEL VIEW or CT. Complications: ULNAR NERVE palsy in Guyon canal, ulnar artery thrombosis (hypothenar hammer syndrome) and attritional rupture of the flexor tendons to the little finger.',
  },
  {
    id: 'metacarpals', name: 'Metacarpals (I–V)', latin: 'Ossa metacarpi',
    region: 'upperlimb', group: 'Metacarpus', type: 'Long bone (miniature)', count: 10, paired: true,
    desc: 'Five miniature long bones forming the palm, numbered I (thumb) to V (little finger). The thumb metacarpal is shorter, stouter and rotated 90° — the key to opposition.',
    landmarks: ['Base (proximal)', 'Shaft', 'Head (the KNUCKLE)', 'Styloid process of the 3rd metacarpal', 'Deep transverse metacarpal ligaments (II–V)'],
    articulations: ['Distal carpal row (carpometacarpal joints)', 'Adjacent metacarpals (intermetacarpal joints)', 'Proximal phalanges (metacarpophalangeal joints — condyloid)'],
    muscles: ['Dorsal and palmar interossei', 'Adductor pollicis', 'Opponens pollicis (MC I)', 'Opponens digiti minimi (MC V)', 'Flexor carpi radialis (MC II, III)', 'Extensor carpi radialis longus (MC II) and brevis (MC III)', 'Extensor carpi ulnaris and flexor carpi ulnaris (MC V)', 'Abductor pollicis longus (MC I base)'],
    ossify: 'MC I ossifies at the BASE like a phalanx; MC II–V ossify at the HEAD. Secondary centres appear at 2–3 years, fusing 15–18.',
    clinical: 'BOXER FRACTURE — fracture of the 5th metacarpal NECK from a clenched-fist punch; up to 40–70° of angulation is tolerated because of the mobile 5th CMC joint. Always ask about a "FIGHT BITE" — a wound over the MCP joint from a tooth is a human-bite inoculation into the joint requiring washout and antibiotics. BENNETT FRACTURE is an intra-articular fracture-dislocation of the MC I base, with abductor pollicis longus pulling the shaft proximally; ROLANDO FRACTURE is its comminuted T/Y-shaped version.',
  },
  {
    id: 'handphalanges', name: 'Phalanges of the Hand', latin: 'Phalanges manus',
    region: 'upperlimb', group: 'Digits', type: 'Long bone (miniature)', count: 28, paired: true,
    desc: 'Fourteen bones per hand: the thumb has proximal and distal phalanges only (2), and each finger has proximal, middle and distal phalanges (3 × 4 = 12).',
    landmarks: ['Base, shaft and head of each phalanx', 'Trochlea of proximal and middle phalanges', 'Ungual (distal) tuberosity supporting the nail bed', 'Volar plates', 'Insertion of the extensor expansion (central slip / terminal tendon)'],
    articulations: ['Metacarpophalangeal (MCP) joints — condyloid, 2 degrees of freedom', 'Proximal and distal interphalangeal (PIP, DIP) joints — pure hinges'],
    muscles: ['Flexor digitorum superficialis (middle phalanx)', 'Flexor digitorum profundus (distal phalanx)', 'Extensor digitorum via the extensor expansion', 'Lumbricals and interossei (into the extensor expansion — flex MCP, extend IP)', 'Flexor and extensor pollicis longus/brevis'],
    ossify: 'One primary centre in the shaft; a single proximal epiphysis appears at 1–2 years and fuses at 14–18.',
    clinical: 'MALLET FINGER — avulsion of the terminal extensor tendon from the distal phalanx base; the DIP droops and cannot be actively extended. Treated in a Stack splint in EXTENSION for 6–8 weeks with NO flexion. BOUTONNIÈRE deformity follows central slip rupture at the PIP; SWAN-NECK is the reverse (PIP hyperextension, DIP flexion), classic in rheumatoid arthritis. JERSEY FINGER is FDP avulsion from the distal phalanx (ring finger, grabbing a shirt) — a surgical injury. Never splint an infected or stiff finger straight: the "safe position" is MCP flexed, IP extended.',
  },

  /* ==============================================================
   * PELVIC GIRDLE — 2 bones (each of 3 fused parts)
   * ============================================================== */
  {
    id: 'ilium', name: 'Ilium', latin: 'Os ilium',
    region: 'pelvic', group: 'Hip Bone', type: 'Flat bone (part of os coxae)', count: 2, paired: true,
    desc: 'The largest and most superior of the three parts of the hip bone — the broad fan-shaped blade you feel as your "hip". Forms the upper two-fifths of the acetabulum.',
    landmarks: ['Iliac crest', 'Anterior superior iliac spine (ASIS)', 'Anterior inferior iliac spine (AIIS)', 'Posterior superior and inferior iliac spines (PSIS, PIIS)', 'Iliac fossa', 'Auricular surface (for the sacrum)', 'Iliac tuberosity', 'Greater sciatic notch', 'Anterior, posterior and inferior gluteal lines', 'Arcuate line'],
    articulations: ['Sacrum (sacroiliac joint)', 'Ischium and pubis (fused at the acetabulum via the triradiate cartilage)', 'Femur (via acetabulum)'],
    muscles: ['Gluteus maximus, medius and minimus', 'Tensor fasciae latae (ASIS region)', 'Sartorius (ASIS)', 'Rectus femoris — straight head (AIIS)', 'Iliacus (iliac fossa)', 'External and internal oblique, transversus abdominis (iliac crest)', 'Latissimus dorsi', 'Quadratus lumborum', 'Erector spinae', 'Inguinal ligament (ASIS to pubic tubercle)'],
    ossify: 'Endochondral. Primary centre at week 8. The ILIAC CREST APOPHYSIS ossifies from lateral to medial between 13 and 25 years — the basis of the RISSER SIGN used to grade skeletal maturity in scoliosis management.',
    clinical: 'The ILIAC CREST is the standard donor site for BONE MARROW BIOPSY (PSIS) and autologous BONE GRAFT. The ASIS is the origin of the inguinal ligament and a key landmark for femoral nerve blocks and for measuring true leg length (ASIS to medial malleolus). AVULSION of the ASIS (sartorius) or AIIS (rectus femoris) occurs in adolescent sprinters and kickers. Meralgia paraesthetica is compression of the lateral femoral cutaneous nerve just medial to the ASIS.',
  },
  {
    id: 'ischium', name: 'Ischium', latin: 'Os ischii',
    region: 'pelvic', group: 'Hip Bone', type: 'Irregular bone (part of os coxae)', count: 2, paired: true,
    desc: 'The posteroinferior part of the hip bone. Its tuberosity is the bone you sit on, and it contributes about two-fifths of the acetabulum.',
    landmarks: ['ISCHIAL TUBEROSITY', 'Ischial spine', 'Lesser sciatic notch', 'Greater sciatic notch (with the ilium)', 'Body and ramus', 'Forms the posterior wall of the obturator foramen'],
    articulations: ['Ilium and pubis (fused at the acetabulum)', 'Femur (via acetabulum)', 'Sacrotuberous and sacrospinous ligaments'],
    muscles: ['HAMSTRINGS — biceps femoris long head, semitendinosus, semimembranosus (ischial tuberosity)', 'Adductor magnus — hamstring part', 'Quadratus femoris', 'Obturator internus and externus', 'Gemelli superior (spine) and inferior (tuberosity)', 'Levator ani and coccygeus (spine)', 'Sacrospinous ligament (spine)'],
    ossify: 'Primary centre at week 15 in utero; fuses with the pubis at 6–8 years and with the ilium at the acetabulum (triradiate cartilage) at 14–16 years.',
    clinical: 'The ISCHIAL SPINE is the key landmark in OBSTETRICS — it defines station 0 in labour and is the target for a PUDENDAL NERVE BLOCK (transvaginally, just medial and posterior to the spine). ISCHIAL TUBEROSITY avulsion is a classic adolescent hurdler injury. Pressure sores over the tuberosity are common in wheelchair users. The sciatic nerve exits the greater sciatic foramen below piriformis — the safe injection quadrant for IM gluteal injection is the UPPER OUTER quadrant.',
  },
  {
    id: 'pubis', name: 'Pubis', latin: 'Os pubis',
    region: 'pelvic', group: 'Hip Bone', type: 'Irregular bone (part of os coxae)', count: 2, paired: true,
    desc: 'The anterior part of the hip bone, meeting its fellow at the pubic symphysis. Contributes about one-fifth of the acetabulum and forms the anterior boundary of the obturator foramen.',
    landmarks: ['Body', 'Superior and inferior rami', 'Pubic tubercle', 'Pubic crest', 'Pectineal line (pecten pubis)', 'Symphyseal surface', 'Obturator groove', 'SUBPUBIC ANGLE (key sex difference)'],
    articulations: ['Opposite pubis (pubic symphysis — secondary cartilaginous)', 'Ilium and ischium (at the acetabulum)', 'Femur (via acetabulum)'],
    muscles: ['Rectus abdominis (pubic crest)', 'Pyramidalis', 'Adductor longus, brevis and magnus', 'Gracilis', 'Pectineus (pectineal line)', 'Obturator internus and externus', 'Levator ani (pubococcygeus)', 'Inguinal ligament (pubic tubercle)', 'Conjoint tendon'],
    ossify: 'Primary centre at week 20 in utero. Fuses with the ischium at 6–8 years; the pubic symphysis face changes systematically with age (SUCHEY–BROOKS method) and is a primary FORENSIC AGE ESTIMATOR in adults.',
    clinical: 'SEX DETERMINATION: the SUBPUBIC ANGLE is >80–85° (rounded, U-shaped) in females and <70° (narrow, V-shaped) in males — the single most reliable skeletal sex indicator. The PUBIC TUBERCLE distinguishes hernias: an INDIRECT/direct INGUINAL hernia lies SUPEROMEDIAL to it, a FEMORAL hernia INFEROLATERAL. Pubic rami fractures are common osteoporotic injuries. OPEN-BOOK PELVIC FRACTURE disrupts the symphysis and can bleed catastrophically — apply a pelvic binder at the GREATER TROCHANTERS, not the iliac crests.',
  },

  /* ==============================================================
   * LOWER LIMB — 60 bones (30 per side)
   * ============================================================== */
  {
    id: 'femur', name: 'Femur', latin: 'Os femoris',
    region: 'lowerlimb', group: 'Thigh', type: 'Long bone', count: 2, paired: true,
    desc: 'THE LONGEST, HEAVIEST AND STRONGEST BONE IN THE HUMAN BODY — roughly a quarter of standing height. Transmits body weight from the hip to the tibia and withstands loads several times body weight in gait.',
    landmarks: ['Head with fovea capitis (for ligamentum teres)', 'Neck (with a ~125° neck-shaft angle)', 'GREATER and LESSER TROCHANTERS', 'Intertrochanteric line (anterior) and crest (posterior)', 'Quadrate tubercle', 'LINEA ASPERA (medial and lateral lips)', 'Gluteal tuberosity', 'Pectineal line', 'Medial and lateral supracondylar lines', 'Adductor tubercle', 'Medial and lateral condyles and epicondyles', 'Intercondylar fossa', 'Patellar surface', 'Popliteal surface'],
    articulations: ['Acetabulum (hip joint — a ball-and-socket, the most stable large joint)', 'Tibia (knee joint — largest synovial joint in the body)', 'Patella (patellofemoral joint)'],
    muscles: ['Gluteus medius and minimus (greater trochanter)', 'Piriformis, obturator internus, gemelli (greater trochanter)', 'Iliopsoas (lesser trochanter)', 'Gluteus maximus (gluteal tuberosity/ITB)', 'Vastus lateralis, medialis and intermedius', 'Adductor longus, brevis, magnus (linea aspera)', 'Pectineus', 'Short head of biceps femoris', 'Gastrocnemius (both heads, posterior condyles)', 'Plantaris', 'Popliteus (lateral condyle)', 'Obturator externus'],
    ossify: 'Endochondral, five centres. The DISTAL FEMORAL EPIPHYSIS is normally OSSIFIED AT BIRTH — its presence on a neonatal X-ray confirms term gestation, and it is used in forensic determination of live birth at term. Head centre appears at 6 months. Fusion 16–20 years.',
    clinical: 'FEMORAL NECK FRACTURE (NOF) in the elderly is a public-health-scale problem. The blood supply to the head is RETROGRADE via the medial femoral circumflex artery and its retinacular branches, so an INTRACAPSULAR displaced fracture risks AVASCULAR NECROSIS — hence arthroplasty rather than fixation. EXTRACAPSULAR (intertrochanteric) fractures preserve the supply and are fixed with a DHS. The classic presentation is a SHORTENED, EXTERNALLY ROTATED limb. SLIPPED UPPER FEMORAL EPIPHYSIS (SUFE) affects obese adolescents — Trethowan/Klein line. Femoral SHAFT fracture can sequester 1–1.5 L of blood; fat embolism syndrome is a recognised complication. The FEMORAL TRIANGLE (NAVY: Nerve, Artery, Vein, Y-fronts, lateral to medial) is the access route for cardiac catheterisation.',
  },
  {
    id: 'patella', name: 'Patella', latin: 'Patella',
    region: 'lowerlimb', group: 'Knee', type: 'Sesamoid bone', count: 2, paired: true,
    desc: 'THE LARGEST SESAMOID BONE IN THE BODY, embedded in the quadriceps tendon. It increases the moment arm of the quadriceps by ~30%, and protects the anterior knee joint.',
    landmarks: ['Base (superior)', 'Apex (inferior)', 'Anterior (subcutaneous) surface', 'Posterior articular surface with medial and lateral facets separated by a vertical ridge', 'Odd facet (far medial)'],
    articulations: ['Femur only (patellofemoral joint) — it does NOT articulate with the tibia'],
    muscles: ['Quadriceps femoris tendon (base) — rectus femoris, vastus lateralis, medialis, intermedius', 'Patellar ligament (apex to the tibial tuberosity)', 'Medial and lateral patellar retinacula'],
    ossify: 'Ossifies from one (occasionally several) centres between 3 and 6 years. Multiple centres that fail to unite give a BIPARTITE PATELLA (usually superolateral, ~2% of people, bilateral in half) — a normal variant that MIMICS A FRACTURE.',
    clinical: 'PATELLAR DISLOCATION is almost always LATERAL, favoured in young females with a shallow trochlea, patella alta and increased Q-angle; VASTUS MEDIALIS OBLIQUUS is the dynamic restraint against it. Transverse patellar fracture from quadriceps contraction gapes because the extensor mechanism is disrupted — test for STRAIGHT LEG RAISE. The patellar tendon reflex tests L3/L4. PREPATELLAR BURSITIS = "housemaid\'s knee"; INFRAPATELLAR = "clergyman\'s knee". OSGOOD–SCHLATTER disease is traction apophysitis at the tibial tuberosity, the patellar ligament\'s insertion.',
  },
  {
    id: 'tibia', name: 'Tibia', latin: 'Tibia',
    region: 'lowerlimb', group: 'Leg', type: 'Long bone', count: 2, paired: true,
    desc: 'The shin bone — the medial and much larger of the two leg bones, and the SECOND LARGEST BONE IN THE BODY. It is the sole weight-bearing bone of the leg; the fibula transmits almost none.',
    landmarks: ['Medial and lateral condyles (tibial plateau)', 'Intercondylar eminence with medial and lateral tubercles', 'TIBIAL TUBEROSITY', 'Gerdy tubercle (ITB insertion)', 'Anterior border (the SHIN — subcutaneous)', 'Medial (subcutaneous) surface', 'Soleal line', 'Interosseous border', 'Fibular notch', 'MEDIAL MALLEOLUS', 'Groove for tibialis posterior'],
    articulations: ['Femur (knee joint)', 'Fibula proximally (superior tibiofibular — plane synovial) and distally (inferior tibiofibular — a SYNDESMOSIS)', 'Talus (ankle/talocrural joint)'],
    muscles: ['Quadriceps via the patellar ligament (tibial tuberosity)', 'Pes anserinus — Sartorius, Gracilis, semiTendinosus ("Say Grace before Tea")', 'Semimembranosus (medial condyle)', 'Tibialis anterior', 'Extensor digitorum longus', 'Tibialis posterior', 'Flexor digitorum longus', 'Soleus (soleal line)', 'Popliteus (above the soleal line)', 'Iliotibial tract (Gerdy tubercle)'],
    ossify: 'Endochondral, three centres. The PROXIMAL EPIPHYSIS IS PRESENT AT BIRTH (like the distal femur). Tibial tuberosity is an extension of the proximal centre. Fusion 16–18 years.',
    clinical: 'The COMMONEST SITE OF OPEN (compound) FRACTURE because the anteromedial surface is subcutaneous — Gustilo–Anderson classified, requiring urgent debridement and antibiotics. ACUTE COMPARTMENT SYNDROME most often follows tibial shaft fracture: PAIN OUT OF PROPORTION and pain on PASSIVE STRETCH are the earliest signs — pulses are present until very late. Fasciotomy of all four compartments is the treatment; do not wait for pressure measurement if clinically obvious. The tibia is the standard site for INTRAOSSEOUS ACCESS in paediatric resuscitation (2 cm below and medial to the tibial tuberosity). Tibial plateau fractures (Schatzker) follow valgus loading and often accompany ACL/meniscal injury.',
  },
  {
    id: 'fibula', name: 'Fibula', latin: 'Fibula',
    region: 'lowerlimb', group: 'Leg', type: 'Long bone', count: 2, paired: true,
    desc: 'The slender lateral leg bone. It bears LITTLE OR NO BODY WEIGHT (<10%), functioning mainly as a muscle attachment and as the lateral buttress of the ankle mortise.',
    landmarks: ['Head with apex (styloid process)', 'NECK (radial— i.e., common fibular nerve winds here)', 'Shaft with three borders and surfaces', 'Interosseous border', 'LATERAL MALLEOLUS (extends further distal than the medial)', 'Malleolar fossa'],
    articulations: ['Tibia proximally and distally', 'Talus (lateral malleolus forms the lateral wall of the ankle mortise)', 'It does NOT articulate with the femur'],
    muscles: ['Biceps femoris (head)', 'Fibularis (peroneus) longus, brevis and tertius', 'Extensor digitorum longus', 'Extensor hallucis longus', 'Tibialis posterior', 'Flexor hallucis longus', 'Soleus', 'Fibular collateral ligament (head)'],
    ossify: 'Endochondral, three centres. Distal epiphysis appears at 1–2 years, proximal at 3–4; fusion 16–20 years.',
    clinical: 'The COMMON FIBULAR (PERONEAL) NERVE winds around the FIBULAR NECK, where it is the most commonly injured nerve in the lower limb — fracture, a tight plaster or prolonged leg crossing causes FOOT DROP and loss of sensation over the dorsum of the foot and lateral leg. MAISONNEUVE FRACTURE — a proximal fibular fracture with a medial malleolar/deltoid injury and syndesmotic disruption; ALWAYS palpate the proximal fibula in an ankle injury. Because it is non-weight-bearing, the fibula is the standard donor for VASCULARISED BONE GRAFT (free fibular flap) in mandibular reconstruction.',
  },
  {
    id: 'talus', name: 'Talus', latin: 'Talus',
    region: 'lowerlimb', group: 'Tarsus', type: 'Short bone', count: 2, paired: true,
    desc: 'The second largest tarsal bone and the KEYSTONE of the ankle — it transmits the ENTIRE body weight from the tibia to the foot. Remarkably, NO MUSCLE ATTACHES TO IT; over 60% of its surface is articular cartilage.',
    landmarks: ['Head', 'Neck', 'Body', 'Trochlea (superior articular surface — wider anteriorly, locking the ankle in dorsiflexion)', 'Medial and lateral malleolar facets', 'Lateral and posterior processes', 'Groove for flexor hallucis longus', 'Sulcus tali (forms the sinus tarsi with the calcaneus)'],
    articulations: ['Tibia and fibula (ankle/talocrural joint)', 'Calcaneus (subtalar/talocalcaneal joint — inversion and eversion)', 'Navicular (talonavicular joint)'],
    muscles: ['NONE — no muscular or tendinous attachment, only ligaments and joint capsules'],
    ossify: 'One centre appearing at ~6 months in utero — ossified at birth.',
    clinical: 'Blood supply is RETROGRADE and precarious (artery of the tarsal canal, deltoid branches, artery of the sinus tarsi entering the neck). TALAR NECK FRACTURE (Hawkins classification, the "aviator\'s astragalus" from forced dorsiflexion) carries a very high risk of AVASCULAR NECROSIS — up to ~90% in Hawkins IV. The HAWKINS SIGN (subchondral lucency at 6–8 weeks) indicates preserved vascularity and is a GOOD prognostic sign. Because the trochlea is wider anteriorly, the ankle is most stable in DORSIFLEXION and most vulnerable in PLANTARFLEXION — hence lateral ligament sprains occur in inversion-plantarflexion.',
  },
  {
    id: 'calcaneus', name: 'Calcaneus', latin: 'Calcaneus',
    region: 'lowerlimb', group: 'Tarsus', type: 'Short bone', count: 2, paired: true,
    desc: 'THE LARGEST TARSAL BONE — the heel bone. It forms the strong posterior lever of the foot, transmitting the pull of the Achilles tendon into propulsion.',
    landmarks: ['Calcaneal tuberosity (Achilles insertion)', 'SUSTENTACULUM TALI (supports the talar head; flexor hallucis longus grooves beneath it)', 'Anterior, middle and posterior talar articular facets', 'Sinus tarsi', 'Fibular (peroneal) trochlea', 'Medial and lateral processes of the tuberosity', 'Calcaneal (Bohler) tuberosity angle'],
    articulations: ['Talus (subtalar joint)', 'Cuboid (calcaneocuboid joint — with the talonavicular forms the transverse tarsal/Chopart joint)'],
    muscles: ['Gastrocnemius and soleus via the ACHILLES (calcaneal) TENDON — the strongest tendon in the body', 'Plantaris', 'Abductor hallucis', 'Abductor digiti minimi', 'Flexor digitorum brevis', 'Quadratus plantae', 'Extensor digitorum brevis', 'PLANTAR FASCIA (medial process of the tuberosity)'],
    ossify: 'Primary centre at ~3 months in utero. A secondary centre for the posterior tuberosity apophysis appears at 6–8 years and fuses at 14–16.',
    clinical: 'CALCANEAL FRACTURE follows an axial load — a FALL FROM HEIGHT. Always examine the OTHER heel and the LUMBAR SPINE (associated burst fracture in ~10%). BÖHLER ANGLE (normally 20–40°) FLATTENS with a depressed fracture. Compartment syndrome of the foot may follow. SEVER DISEASE is calcaneal apophysitis in active children (age 8–14), a self-limiting cause of heel pain. PLANTAR FASCIITIS causes classic first-step-in-the-morning inferomedial heel pain; the "heel spur" seen on X-ray is a consequence, not the cause.',
  },
  {
    id: 'navicular', name: 'Navicular', latin: 'Os naviculare',
    region: 'lowerlimb', group: 'Tarsus', type: 'Short bone', count: 2, paired: true,
    desc: 'A boat-shaped bone on the medial side of the foot between the talar head and the three cuneiforms — the keystone of the MEDIAL LONGITUDINAL ARCH.',
    landmarks: ['NAVICULAR TUBEROSITY (prominent medially — an important surface landmark)', 'Concave proximal surface for the talar head', 'Three distal facets for the cuneiforms'],
    articulations: ['Talus', 'Three cuneiforms', 'Cuboid (occasionally)'],
    muscles: ['TIBIALIS POSTERIOR (main insertion at the tuberosity) — the principal dynamic support of the medial arch', 'Spring (plantar calcaneonavicular) ligament attachment'],
    ossify: 'The LAST tarsal to ossify — one centre at ~3 years (girls) to 4 years (boys).',
    clinical: 'KÖHLER DISEASE is avascular necrosis of the navicular in children aged 4–6 (self-limiting); MÜLLER–WEISS is the adult form. NAVICULAR STRESS FRACTURE is a high-risk (poorly vascularised central third) injury in runners and jumpers — often missed on X-ray, needing CT/MRI, and requiring non-weight-bearing. ACCESSORY NAVICULAR (os tibiale externum, ~10% of people) can be painful and is associated with tibialis posterior dysfunction and PES PLANUS (flat foot).',
  },
  {
    id: 'cuboid', name: 'Cuboid', latin: 'Os cuboideum',
    region: 'lowerlimb', group: 'Tarsus', type: 'Short bone', count: 2, paired: true,
    desc: 'The most lateral tarsal bone of the distal row, forming the keystone of the LATERAL LONGITUDINAL ARCH.',
    landmarks: ['Groove for the FIBULARIS (PERONEUS) LONGUS tendon on the plantar surface', 'Tuberosity of the cuboid', 'Facets for the 4th and 5th metatarsals'],
    articulations: ['Calcaneus', 'Lateral cuneiform', 'Navicular (sometimes)', '4th and 5th metatarsals'],
    muscles: ['Tibialis posterior (slip)', 'Flexor hallucis brevis (partly)', 'Long and short plantar ligaments'],
    ossify: 'One centre appearing around the time of BIRTH (9 months in utero to 6 months) — often the only distal-row tarsal ossified at term.',
    clinical: '"NUTCRACKER" FRACTURE — the cuboid is crushed between the calcaneus and the metatarsal bases in forced forefoot abduction. CUBOID SYNDROME is a subtle subluxation causing lateral midfoot pain in dancers and runners. The fibularis longus tendon turns sharply here to cross the sole and insert on the medial cuneiform and 1st metatarsal, actively supporting the transverse arch.',
  },
  {
    id: 'cuneiforms', name: 'Cuneiform Bones (Medial, Intermediate, Lateral)', latin: 'Ossa cuneiformia',
    region: 'lowerlimb', group: 'Tarsus', type: 'Short bone', count: 6, paired: true,
    desc: 'Three wedge-shaped bones in the distal tarsal row. Their wedge orientation creates and maintains the TRANSVERSE ARCH of the foot. The intermediate cuneiform is the shortest, recessing the 2nd metatarsal base into a stable mortise.',
    landmarks: ['Medial cuneiform — largest, wedge inverted (base plantar)', 'Intermediate cuneiform — smallest, forms the keystone of the transverse arch', 'Lateral cuneiform — intermediate size', 'Recess for the 2nd metatarsal base'],
    articulations: ['Navicular proximally', 'Metatarsals I–III distally', 'Cuboid (lateral cuneiform)', 'Each other'],
    muscles: ['TIBIALIS ANTERIOR (medial cuneiform — with the 1st metatarsal base)', 'FIBULARIS LONGUS (medial cuneiform, plantar)', 'Tibialis posterior (slips to all three)', 'Flexor hallucis brevis (lateral cuneiform)'],
    ossify: 'Lateral cuneiform ossifies FIRST (~1 year), then medial (~2 years), then intermediate (~3 years).',
    clinical: 'LISFRANC INJURY — disruption of the tarsometatarsal joint complex, in which the LISFRANC LIGAMENT running from the medial cuneiform to the 2nd metatarsal base is torn. It is MISSED IN UP TO 20% of cases and is a career-ending injury if untreated. Look for PLANTAR ECCHYMOSIS, inability to weight-bear, and a >2 mm gap between the 1st and 2nd metatarsal bases on a WEIGHT-BEARING film. Tibialis anterior and fibularis longus insert on opposite surfaces of the medial cuneiform and act as a stirrup balancing the foot.',
  },
  {
    id: 'metatarsals', name: 'Metatarsals (I–V)', latin: 'Ossa metatarsi',
    region: 'lowerlimb', group: 'Metatarsus', type: 'Long bone (miniature)', count: 10, paired: true,
    desc: 'Five miniature long bones of the forefoot. The 1st is short and thick for weight-bearing; the 2nd is the longest and most rigidly fixed. Together they distribute load across the ball of the foot.',
    landmarks: ['Base, shaft and head of each', 'TUBEROSITY OF THE 5TH METATARSAL (styloid process — prominent laterally)', 'Sesamoids beneath the 1st metatarsal head', 'Recessed 2nd metatarsal base (Lisfranc mortise)'],
    articulations: ['Cuneiforms and cuboid (tarsometatarsal/Lisfranc joints)', 'Adjacent metatarsals', 'Proximal phalanges (metatarsophalangeal joints)'],
    muscles: ['FIBULARIS BREVIS (5th metatarsal tuberosity)', 'Fibularis tertius (5th shaft)', 'Fibularis longus and tibialis anterior (1st base)', 'Dorsal and plantar interossei', 'Adductor hallucis', 'Flexor digiti minimi brevis', 'Abductor digiti minimi'],
    ossify: 'MT I ossifies at the base (like a phalanx); MT II–V at the head. Secondary centres 2–4 years, fusing 16–20. The 5th metatarsal tuberosity apophysis (appearing ~9–11 years) runs PARALLEL to the shaft — a fracture runs TRANSVERSE.',
    clinical: 'Distinguish carefully at the 5th metatarsal base: (1) PSEUDO-JONES / avulsion fracture of the tuberosity by fibularis brevis — very common, heals well in a walking boot; (2) TRUE JONES FRACTURE at the metaphyseal–diaphyseal junction (~1.5 cm distal) — a WATERSHED blood supply zone with a high NON-UNION rate, often needing screw fixation in athletes. MARCH (stress) FRACTURE classically affects the 2nd or 3rd metatarsal shaft in soldiers and runners — X-ray is normal for 2–3 weeks. FREIBERG DISEASE is AVN of the 2nd metatarsal head in adolescent girls.',
  },
  {
    id: 'footphalanges', name: 'Phalanges of the Foot', latin: 'Phalanges pedis',
    region: 'lowerlimb', group: 'Toes', type: 'Long bone (miniature)', count: 28, paired: true,
    desc: 'Fourteen bones per foot: the hallux (great toe) has two phalanges, each of the lateral four toes has three. They are much shorter and stouter than those of the hand — built for push-off, not manipulation.',
    landmarks: ['Base, shaft and head of each phalanx', 'Distal phalanges bear an ungual tuberosity', 'The distal phalanges of toes 2–5 are frequently fused with the middle phalanx in adults'],
    articulations: ['Metatarsophalangeal (MTP) joints', 'Interphalangeal (IP) joints — the hallux has only one'],
    muscles: ['Extensor hallucis longus and brevis', 'Flexor hallucis longus and brevis', 'Extensor digitorum longus and brevis', 'Flexor digitorum longus and brevis', 'Abductor and adductor hallucis', 'Lumbricals and interossei', 'Abductor and flexor digiti minimi'],
    ossify: 'One shaft centre plus a proximal epiphysis appearing at 2–8 years, fusing at 16–18.',
    clinical: 'HALLUX VALGUS (bunion) is lateral deviation of the great toe at the MTP joint with a prominent medial eminence — associated with narrow footwear and hypermobile 1st ray. TURF TOE is a hyperextension sprain of the 1st MTP plantar plate. Fractured lesser toe phalanges are treated with BUDDY STRAPPING. GOUT most classically strikes the 1st MTP joint (PODAGRA). The hallux carries about twice the load of the other toes combined at toe-off.',
  },
  {
    id: 'sesamoids', name: 'Sesamoid Bones of the Hallux', latin: 'Ossa sesamoidea',
    region: 'lowerlimb', group: 'Sesamoids', type: 'Sesamoid bone', count: 4, paired: true,
    desc: 'Two constant sesamoids (medial/tibial and lateral/fibular) embedded in the tendons of flexor hallucis brevis beneath the 1st metatarsal head. NOT counted among the 206 named bones, but clinically important.',
    landmarks: ['Medial (tibial) sesamoid — larger, bears more load', 'Lateral (fibular) sesamoid', 'Intersesamoid ridge (crista) of the 1st metatarsal head'],
    articulations: ['Plantar surface of the 1st metatarsal head'],
    muscles: ['Flexor hallucis brevis (medial and lateral heads)', 'Abductor hallucis (medial sesamoid)', 'Adductor hallucis (lateral sesamoid)'],
    ossify: 'Ossify at 8–12 years, often from multiple centres — a BIPARTITE sesamoid (usually the medial, ~10%) is a normal variant that mimics a fracture.',
    clinical: 'SESAMOIDITIS causes plantar 1st MTP pain in dancers and runners. They absorb up to 50% of body weight at push-off and protect the flexor hallucis longus tendon. Distinguishing a bipartite sesamoid from a fracture: bipartite has smooth, rounded, sclerotic margins and is often bilateral (compare the other foot).',
  },
];

/** Fast id → record lookup. */
export const BONE_BY_ID = Object.fromEntries(BONES.map((b) => [b.id, b]));

/** Total named bones in the adult skeleton, for the HUD counter. */
export const TOTAL_NAMED_BONES = 206;

/**
 * Sex-based skeletal differences shown in the comparison panel.
 * These are population tendencies used in forensic anthropology, not
 * absolutes — sexing a skeleton relies on the pelvis above all else.
 */
export const SEX_DIFFERENCES = [
  { feature: 'Subpubic angle',      male: 'Narrow, V-shaped (<70°)',        female: 'Wide, U-shaped (>80–85°)', note: 'Single most reliable indicator' },
  { feature: 'Pelvic inlet',        male: 'Heart-shaped, narrow',            female: 'Oval/round, wide',          note: 'Obstetric adaptation' },
  { feature: 'Greater sciatic notch', male: 'Narrow (~50°)',                 female: 'Wide (~70°)',               note: 'Highly reliable' },
  { feature: 'Sacrum',              male: 'Long, narrow, more curved',       female: 'Short, wide, less curved',  note: 'Enlarges the pelvic cavity' },
  { feature: 'Iliac blades',        male: 'More vertical',                   female: 'More flared laterally',     note: 'Wider hips' },
  { feature: 'Acetabulum',          male: 'Larger, faces laterally',         female: 'Smaller, faces anterolaterally', note: '' },
  { feature: 'Obturator foramen',   male: 'Oval',                            female: 'Triangular',                note: '' },
  { feature: 'Skull — brow ridge',  male: 'Prominent supraorbital ridges',   female: 'Smooth, rounded forehead',  note: '' },
  { feature: 'Mastoid process',     male: 'Large, rugged',                   female: 'Small, smooth',             note: '' },
  { feature: 'Mandible',            male: 'Square chin, everted gonial angle', female: 'Rounded/pointed chin',    note: '' },
  { feature: 'Overall robusticity', male: 'Heavier, thicker cortex, marked muscle attachments', female: 'Lighter, smoother', note: '' },
  { feature: 'Femoral Q-angle',     male: '~12–14°',                         female: '~15–18°',                   note: 'Wider pelvis → increased valgus; raises patellofemoral and ACL injury risk' },
  { feature: 'Thoracic cage',       male: 'Longer, larger',                  female: 'Shorter, more rounded',     note: '' },
];

/** Quick-reference facts rotated in the HUD. */
export const BONE_FACTS = [
  'The adult skeleton has 206 bones; a newborn has about 270, which fuse with growth.',
  'The femur is the longest and strongest bone — it can withstand ~30 times body weight.',
  'The stapes is the smallest bone, at roughly 3 mm and 2–4 mg.',
  'Over half of all bones in the body are in the hands (54) and feet (52).',
  'The hyoid is the only bone that articulates with no other bone.',
  'Bone is about five times stronger than steel of the same weight, gram for gram.',
  'The skeleton is completely replaced roughly every 10 years by remodelling.',
  'Red bone marrow in adults is confined mainly to the axial skeleton and proximal femora.',
  'The clavicle is the first bone to ossify and the last to finish, at about age 25.',
  'The talus has no muscle attachments — over 60% of its surface is articular cartilage.',
];
