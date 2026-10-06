// Copy into the Khmer One repository's data/ directory, then append this entry
// to apps. Import paths below match the inspected Khmer One schema.
import {AppCategory,type AppEntry} from '../types/app';
export function shopStoryEntry(verifiedDeploymentUrl:string|null):AppEntry {
 const url=verifiedDeploymentUrl?new URL(verifiedDeploymentUrl):null;
 if(url&&url.protocol!=='https:')throw new Error('Use a verified HTTPS deployment URL');
 return {
  id:'khmer-shop-story-maker',
  title:{en:'Khmer Shop Story Maker',km:'អ្នកបង្កើតវីដេអូផ្សព្វផ្សាយហាងខ្មែរ'},
  category:AppCategory.Utilities,
  categoryLabel:{en:'Merchant Tools & Enterprise',km:'ឧបករណ៍ហាង និងអាជីវកម្ម'},
  tagline:{en:'Your shop. Your story.',km:'ហាងរបស់អ្នក រឿងរបស់អ្នក'},
  description:{en:'Create attractive promotional stories and short videos for your shop using product photos, Khmer or English descriptions, prices, contact details, and your own KHQR.',km:'បង្កើតរឿងផ្សព្វផ្សាយ និងវីដេអូខ្លីៗសម្រាប់ហាងរបស់អ្នក ដោយប្រើរូបថតផលិតផល អត្ថបទជាភាសាខ្មែរ ឬអង់គ្លេស តម្លៃ ព័ត៌មានទំនាក់ទំនង និង KHQR របស់អ្នក។'},
  audience:{en:'Small merchants, entrepreneurs & students',km:'ម្ចាស់ហាងខ្នាតតូច សហគ្រិន និងនិស្សិត'},
  grades:['high-school','vocational-adult'],hasBilingualToggle:true,
  features:[{en:'Local drafts & product photos',km:'គម្រោង និងរូបផលិតផលរក្សាក្នុងឧបករណ៍'},{en:'Vertical video & PNG exports',km:'វីដេអូបញ្ឈរ និងរូបភាព PNG'}],
  tags:['shop','merchant','video','KHQR','TikTok','Facebook','ហាង','ផ្សព្វផ្សាយ'],
  icon:'enterprise',url:url?.href??null,offlineReady:true,
  notice:{en:'KHQR images do not verify payments. Check the recipient in your banking app.',km:'រូបភាព KHQR មិនបញ្ជាក់ការបង់ប្រាក់ទេ។ ពិនិត្យឈ្មោះអ្នកទទួលក្នុងកម្មវិធីធនាគាររបស់អ្នក។'}
 };
}
