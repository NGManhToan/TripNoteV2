# TripNote Welcome — video storyboard and implementation comparison

## Source and method

- Source video: `gemini_generated_video_b193f30c.mp4`
- Video dimensions/rate: 720 × 1280, 24 fps, 30.037 seconds.
- Welcome intro sampled from 0.00 to 8.75 seconds at 0.25-second intervals (36 extracted frames).
- Each row links to its original-resolution PNG in `reference/`.
- The live page was opened in the in-app browser and visually inspected after the intro had completed. Its viewport was not the same portrait aspect ratio as the reference. No source files were edited.

## Scene anchors observed in the video

- Camera: frontal view of the scene, centered on the globe. No large pan or cut is visible during the intro. Absolute camera coordinates, lens, and exact easing cannot be recovered from the rendered frames.
- Globe: centered horizontally, slightly above the scene midpoint; it is faint and small at the first sampled frame, then grows/brights over roughly the first second.
- Plane: enters from the left side of the globe, crosses in front on a luminous warm trail, and continues around the globe.
- Cards: mountain photo upper-left, bay upper-right, city lower-left, temple lower-right. All four are visible by about 3.00 seconds.
- Identity: camera mark centered under the globe, then “Trip Note”, then “Plan · Go · Remember”.
- CTA: centered below the identity; visible by about 7.00 seconds. The assembled scene holds through the last Welcome sample at 8.75 seconds.
- Background: dark navy scene, soft upper-left light, sparse stars/particles and a reflective floor. Light and particle brightness remain subtle during the intro.

## Timestamp storyboard and frame-by-frame comparison

“Code timing” below is read from the current implementation. It does not prove what the browser rendered at that exact timestamp. Rendered position/scale comparison is marked unverified where a same-aspect, timestamped browser capture was unavailable.

| Time | Reference screenshot | What changes / observed state | Current implementation comparison |
|---:|---|---|---|
| 0.00 | [Open frame](reference/frame-00.png) | Dark scene and floor reflection; a faint globe is already present. No plane, cards, identity, or CTA. | **Order matches:** Earth mounts at stage 0 with low initial opacity/scale; other elements are gated. Exact first-frame appearance unverified. |
| 0.25 | [Open frame](reference/frame-01.png) | Globe becomes more apparent; background light and sparse particles persist. | Earth reveal is configured for 1.00 s. Timing broadly matches; rendered opacity/scale unverified. |
| 0.50 | [Open frame](reference/frame-02.png) | Globe continues growing and brightening. | Same reveal interval; no other staged elements expected. Rendered comparison unverified. |
| 0.75 | [Open frame](reference/frame-03.png) | Globe approaches its settled size. | Earth is still in its configured reveal. Exact size not verified. |
| 1.00 | [Open frame](reference/frame-04.png) | Globe is near full size; plane is not yet prominent. | Globe reveal completes at about 1.00 s. Plane stage is scheduled for 1.25 s. |
| 1.25 | [Open frame](reference/frame-05.png) | Plane begins entering at the globe’s left/lower-left. | Plane stage is scheduled at 1.25 s with a 0.45 s entry. Order/timing match the sampled event. Path position not visually verified at this timestamp. |
| 1.50 | [Open frame](reference/frame-06.png) | Plane becomes clearer left of the globe; warm trail is visible. | Plane entry is in progress. Its persistent orbit uses `flightTime` speed 0.026, far slower than the movement visible across the intro; likely mismatch in orbital speed. |
| 1.75 | [Open frame](reference/frame-07.png) | Plane moves toward/in front of the globe. | Entry nears completion, but orbit progress remains very slow. **Motion mismatch likely.** |
| 2.00 | [Open frame](reference/frame-08.png) | Plane crosses the globe’s front region; luminous trail/sparkles remain visible. | Plane is present, but configured orbit speed does not reproduce the observed travel over this interval. |
| 2.25 | [Open frame](reference/frame-09.png) | Plane proceeds around the globe; first card edges begin appearing. | First card stage is scheduled for 2.25 s. Plane speed remains a likely mismatch. |
| 2.50 | [Open frame](reference/frame-10.png) | Upper cards begin to resolve; lower cards are still entering. | Cards are staged at 2.25, 2.40, 2.55, and 2.70 s. Their reveal order matches broadly. Per-frame opacity and placement unverified. |
| 2.75 | [Open frame](reference/frame-11.png) | More cards resolve around the globe. | Four cards have been mounted by 2.70 s; individual settling continues. |
| 3.00 | [Open frame](reference/frame-12.png) | Four cards are visible in the four quadrants around the globe. | The configured card order/positions correspond to those quadrants; final rendered positions not measured against the same viewport. |
| 3.25 | [Open frame](reference/frame-13.png) | Cards hold/settle; plane and globe continue moving. | Card entries should be settled by this point. Ongoing plane movement is likely too slow. |
| 3.50 | [Open frame](reference/frame-14.png) | Scene holds; no text yet. | No new UI stage; ordering matches. Rendered visual comparison unverified. |
| 3.75 | [Open frame](reference/frame-15.png) | Scene holds; camera mark is not yet fully present. | Camera mark stage is scheduled at 4.00 s. |
| 4.00 | [Open frame](reference/frame-16.png) | Camera mark begins appearing below the globe. | Camera mark stage is scheduled at 4.00 s with a 0.42 s reveal. Broad timing match. |
| 4.25 | [Open frame](reference/frame-17.png) | Camera mark resolves; title has not fully appeared. | Camera mark reveal is in progress; title stage is scheduled at 4.75 s. |
| 4.50 | [Open frame](reference/frame-18.png) | Camera mark holds; title is not yet prominent. | No new stage; ordering matches. |
| 4.75 | [Open frame](reference/frame-19.png) | “Trip Note” begins appearing. | Title stage is scheduled at 4.75 s, with a 0.55 s transition. Broad timing match. |
| 5.00 | [Open frame](reference/frame-20.png) | Title is partially resolved. | Title transition is in progress. Exact opacity/translation curve unverified. |
| 5.25 | [Open frame](reference/frame-21.png) | Title continues resolving. | Title transition is in progress. |
| 5.50 | [Open frame](reference/frame-22.png) | Title is nearly/full visible; subtitle begins appearing. | Subtitle stage is scheduled at 5.50 s. Broad ordering/timing match. |
| 5.75 | [Open frame](reference/frame-23.png) | Title and subtitle are visible and settling. | Subtitle’s configured 0.44 s reveal is in progress. Exact baseline and opacity unverified. |
| 6.00 | [Open frame](reference/frame-24.png) | Identity holds; CTA is not yet fully visible. | CTA is scheduled at 6.45 s. Ordering matches. |
| 6.25 | [Open frame](reference/frame-25.png) | Identity remains; CTA starts to emerge near this point. | CTA is scheduled 0.20 s later, at 6.45 s. **Possible CTA timing lag** relative to sampled video. |
| 6.50 | [Open frame](reference/frame-26.png) | CTA is emerging. | CTA reveal has begun; configured reveal duration is 0.55 s. |
| 6.75 | [Open frame](reference/frame-27.png) | CTA becomes readable. | CTA reveal is in progress. |
| 7.00 | [Open frame](reference/frame-28.png) | Full Welcome scene and CTA are visible. | CTA is scheduled to finish at about 7.00 s. Timing broadly matches. |
| 7.25 | [Open frame](reference/frame-29.png) | Complete scene holds; globe/plane/cards continue motion. | Stages are complete. Plane orbit speed remains the clearest code-level mismatch. |
| 7.50 | [Open frame](reference/frame-30.png) | Complete scene holds. | No new stage; same motion concern. |
| 7.75 | [Open frame](reference/frame-31.png) | Complete scene holds. | No new stage; same motion concern. |
| 8.00 | [Open frame](reference/frame-32.png) | Complete scene holds. | No new stage; same motion concern. |
| 8.25 | [Open frame](reference/frame-33.png) | Complete scene holds. | No new stage; same motion concern. |
| 8.50 | [Open frame](reference/frame-34.png) | Complete scene remains visible; transition is not clearly underway. | Existing CTA-to-Home transition is click-triggered, not time-triggered. This matches a held welcome state if the reference has not been tapped. |
| 8.75 | [Open frame](reference/frame-35.png) | Complete scene remains visible; no unambiguous transition onset in this sample. | Same as 8.50 s. Exact later transition onset is not part of the captured Welcome checkpoints. |

## Live implementation comparison

The current page was visually captured in the in-app browser after the intro completed. The available browser viewport was wider/shorter than the reference portrait frame, so direct pixel-position comparison is invalid. In that capture:

- **Present:** dark star field, globe, four travel photos, airplane, camera mark, title, and CTA.
- **Visible difference:** the globe reads as brighter blue and larger than the muted/silver globe in the reference samples.
- **Likely timing/motion difference:** the current 3D airplane path advances at `0.026` per second; the reference plane traverses a much more visible portion of its orbit during the intro.
- **Unverified:** exact card sizes/rotations, camera framing, text baselines, and CTA spacing at 720 × 1280 or equivalent mobile aspect ratio. The live screenshot was not captured at that aspect ratio or at each 0.25-second checkpoint.
- **Not identified as missing:** globe, airplane, four card photos, camera mark, particles, and background assets all exist in the project. Exact original 3D scene/floor-rendering data is not available as a separate source asset.

## Review status

This is a review artifact only. No implementation changes were made in response to this storyboard request. Wait for storyboard approval before making further Welcome changes.
