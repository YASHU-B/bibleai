# AdMob Setup Guide

This guide helps you set up Google AdMob to earn revenue from your Bible AI app.

## Overview

AdMob provides:
- **Banner ads** (top/bottom of screens) - Displays constantly
- **Interstitial ads** (full-screen) - Show between chapters, on question submit
- **Rewarded ads** (watch to unlock) - Watch 30s video to get bonus questions

## Step 1: Create Google AdMob Account

1. Go to [Google AdMob](https://admob.google.com)
2. Sign in with Google Account
3. Click **"Get Started"**
4. Agree to terms and create account
5. Add payment method (India: UPI, Bank, Card)

## Step 2: Add App to AdMob

1. In AdMob console, click **"Apps"** → **"Add App"**
2. Select **"Android"** (we'll do iOS next)
3. App name: `Bible AI Telugu`
4. Play Store link: (leave blank for now)
5. Get the **App ID** (format: `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`)

## Step 3: Create Ad Units

Create ad units for each ad type:

### Banner Ad Unit
1. Click **"Ad units"** → **"Create ad unit"**
2. Name: `Bible Reader Banner`
3. Ad format: **Banner**
4. Copy the **Ad Unit ID** (format: `ca-app-pub-3940256099942544/6300978111`)

### Interstitial Ad Unit
1. Click **"Ad units"** → **"Create ad unit"**
2. Name: `Chapter Change Interstitial`
3. Ad format: **Interstitial**
4. Copy the **Ad Unit ID**

### Rewarded Ad Unit (Optional)
1. Click **"Ad units"** → **"Create ad unit"**
2. Name: `Bonus Questions Rewarded`
3. Ad format: **Rewarded**
4. Copy the **Ad Unit ID**

## Step 4: Update App Configuration

### Update `src/lib/admobService.ts`

Replace the test Ad IDs with your real IDs:

```typescript
// Banner Ad Unit IDs (get from AdMob console)
export const BANNER_AD_UNIT_IDS = {
  ANDROID: 'ca-app-pub-YOUR_ANDROID_BANNER_ID',
  IOS: 'ca-app-pub-YOUR_IOS_BANNER_ID',
};

// Interstitial Ad Unit IDs
export const INTERSTITIAL_AD_UNIT_IDS = {
  ANDROID: 'ca-app-pub-YOUR_ANDROID_INTERSTITIAL_ID',
  IOS: 'ca-app-pub-YOUR_IOS_INTERSTITIAL_ID',
};
```

### Update `app.json`

Add your AdMob App IDs:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidClientId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy",
          "iosClientId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
        }
      ]
    ]
  }
}
```

## Step 5: Initialize AdMob in Your App

In `src/app/_layout.tsx`, initialize AdMob on app start:

```tsx
import { initializeAdMob } from '@/lib/admobService';

export default function RootLayout() {
  useEffect(() => {
    initializeAdMob();
  }, []);
  
  // ... rest of layout
}
```

## Step 6: Add Ads to Screens

### Add Banner to Bible Reader
In `src/app/(tabs)/reader.tsx`:

```tsx
import { AdBanner } from '@/components/ad-banner';

export default function Reader() {
  return (
    <View style={styles.container}>
      <FlatList
        // ... your content
        ListFooterComponent={<AdBanner size="banner" />}
      />
    </View>
  );
}
```

### Add Banner to AI Assistant
In `src/app/(tabs)/assistant.tsx`:

```tsx
import { AdBanner } from '@/components/ad-banner';

export default function Assistant() {
  return (
    <View style={styles.container}>
      {/* Chat messages */}
      <AdBanner size="banner" style={{ marginTop: 10 }} />
      {/* Input area */}
    </View>
  );
}
```

### Add Banner to Devotionals
In `src/app/(tabs)/devotionals.tsx`:

```tsx
import { AdBanner } from '@/components/ad-banner';

// At the bottom of devotional content
<AdBanner size="banner" />
```

## Step 7: Test Ads

### Using Test Ad IDs (Safe for Development)

The current IDs are **Google test IDs** - they're safe to use during development:
- Android: `ca-app-pub-3940256099942544/6300978111`
- iOS: `ca-app-pub-3940256099942544/2934735716`

Test with these first to ensure ads display correctly.

### Transition to Real Ads

Once you're ready to publish:
1. Replace test IDs with your real AdMob Ad Unit IDs
2. Build and submit to Play Store
3. AdMob typically takes 24-48 hours to start serving real ads

## Step 8: Monitor Earnings

1. In AdMob console, go to **"Home"** dashboard
2. Check **Estimated earnings**, **Impressions**, **RPM**
3. View earnings by country, platform, ad format

### Typical Earnings (India)
- **CPM** (per 1000 impressions): ₹50-200
- **RPM** (revenue per 1000 impressions): ₹30-150
- For 10,000 daily users with 3 ads shown = ₹1,500-3,000/day

## Step 9: Best Practices

✅ **DO:**
- Place ads bottom/top of screens (less intrusive)
- Show interstitials between content (between chapters)
- Use keyword targeting (bible, scripture, spiritual)
- Monitor user experience (ads shouldn't break functionality)
- Test on real device before publishing

❌ **DON'T:**
- Click your own ads (results in ban)
- Use too many ads on one screen (bad UX)
- Show ads too frequently (users uninstall)
- Incentivize clicks artificially
- Violate Google's ad policies

## Step 10: iOS Setup

1. In AdMob console, add iOS app:
   - App name: `Bible AI Telugu`
   - Bundle ID: `com.bibleaitelugu.app` (from app.json)
   - Get iOS App ID

2. Create iOS Ad Units separately

3. Update `admobService.ts` with iOS IDs

4. Rebuild iOS app with new configuration

## Troubleshooting

### Ads Not Showing?
1. Verify Ad Unit IDs in `admobService.ts`
2. Check internet connectivity
3. Ensure AdMob is initialized in `_layout.tsx`
4. Wait 24 hours for AdMob to activate (new apps)

### "Invalid Ad Request" Error?
- Verify Ad Unit ID format
- Check if Ad Unit is activated in AdMob console
- Ensure app is in same region as Ad Unit

### Blank Ads?
- Normal during first 24-48 hours
- AdMob needs time to serve relevant ads

## Revenue Optimization Tips

1. **Strategic Placement**: Put ads where users naturally pause
   - Between chapters (not during reading)
   - After submitting AI question (not in middle of conversation)
   - Bottom of devotional (not covering text)

2. **Keyword Optimization**: In AdBanner component, update keywords:
   ```tsx
   keywords: ['bible', 'scripture', 'spiritual', 'religious', 'devotional', 'prayer', 'faith'],
   ```

3. **Frequency Capping**: Limit ads per user per hour
4. **A/B Testing**: Try different ad placements, measure RPM

## Resources

- [Google AdMob Help](https://support.google.com/admob)
- [react-native-google-mobile-ads Docs](https://react-native-google-mobile-ads.invertase.io/)
- [AdMob Policy](https://support.google.com/admob/answer/9335564)
