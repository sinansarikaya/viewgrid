import React from 'react';
import type { DeviceProfile, Orientation } from '../../core/types';
import s from './DeviceFrame.module.css';

interface Props {
  profile: DeviceProfile;
  orientation: Orientation;
  zoom: number;
  enabled: boolean;
  finish?: string;
  children: React.ReactNode;
}

export function DeviceFrame({ profile, orientation, zoom, enabled, finish, children }: Props) {
  // If frames are disabled by user, render only the bare screen container
  if (!enabled) {
    return <div className={s.screenClip}>{children}</div>;
  }

  const frameType = profile.deviceFrame?.type || profile.category;
  const isPortrait = orientation === 'portrait';
  const scale = (px: number) => Math.max(1, Math.round(px * zoom));

  // 1. iPhone SE / Classic (No notch! Iconic top & bottom bezels with Touch ID Home Button)
  if (frameType === 'iphone-classic' || profile.id === 'iphone-se') {
    const topBezelH = scale(isPortrait ? 40 : 12);
    const bottomBezelH = scale(isPortrait ? 46 : 12);
    const sidePadding = scale(10);
    const chassisR = Math.max(6, scale(24));
    const screenR = Math.max(2, scale(4));
    const homeBtnSize = Math.max(14, scale(34));

    return (
      <div className={s.frameContainer}>
        <div
          className={s.iphoneClassicChassis}
          style={{
            paddingLeft: sidePadding,
            paddingRight: sidePadding,
            paddingTop: 0,
            paddingBottom: 0,
            borderRadius: chassisR,
          }}
        >
          {isPortrait && (
            <div className={s.classicTopBezel} style={{ height: topBezelH }}>
              <div
                className={s.classicFrontCamera}
                style={{
                  width: Math.max(3, scale(6)),
                  height: Math.max(3, scale(6)),
                }}
              />
              <div
                className={s.classicSpeaker}
                style={{
                  width: Math.max(18, scale(38)),
                  height: Math.max(2, scale(3)),
                  borderRadius: scale(2),
                }}
              />
            </div>
          )}

          <div className={s.classicScreen} style={{ borderRadius: screenR, overflow: 'hidden', isolation: 'isolate' }}>
            <div style={{ borderRadius: 'inherit', overflow: 'hidden', width: '100%', height: '100%', position: 'relative', isolation: 'isolate' }}>
              {children}
            </div>
          </div>

          {isPortrait && (
            <div className={s.classicBottomBezel} style={{ height: bottomBezelH }}>
              <div
                className={s.homeTouchIdBtn}
                style={{
                  width: homeBtnSize,
                  height: homeBtnSize,
                }}
              >
                <div
                  className={s.homeTouchIdSquare}
                  style={{
                    width: Math.max(5, Math.round(homeBtnSize * 0.35)),
                    height: Math.max(5, Math.round(homeBtnSize * 0.35)),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. iPhone 15 Pro / Dynamic Island
  if (frameType === 'iphone-15' || profile.id.includes('iphone-15')) {
    const chassisPadding = Math.max(3, scale(9));
    const chassisR = Math.max(8, scale(38));
    const screenR = Math.max(6, scale(30));
    const islandW = Math.max(36, scale(88));
    const islandH = Math.max(10, scale(22));
    const islandR = Math.max(5, scale(11));

    const iphoneBg = finish === 'black'
      ? 'linear-gradient(135deg, #2b2c30 0%, #17181a 45%, #0f1011 100%)'
      : finish === 'white'
      ? 'linear-gradient(135deg, #d8dade 0%, #c2c5cd 45%, #a8acb6 100%)'
      : 'linear-gradient(135deg, #4d4f57 0%, #2f3036 45%, #1b1c20 100%)';

    return (
      <div className={s.frameContainer}>
        <div
          className={s.iphone15Chassis}
          style={{
            padding: chassisPadding,
            borderRadius: chassisR,
            background: iphoneBg,
          }}
        >
          <div className={s.iphone15Screen} style={{ borderRadius: screenR, overflow: 'hidden', isolation: 'isolate' }}>
            {isPortrait && (
              <>
                <div
                  className={s.dynamicIsland}
                  style={{
                    top: Math.max(3, scale(8)),
                    width: islandW,
                    height: islandH,
                    borderRadius: islandR,
                    padding: `0 ${Math.max(3, scale(8))}px`,
                  }}
                >
                  <div
                    className={s.faceIdSensor}
                    style={{
                      width: Math.max(3, scale(6)),
                      height: Math.max(3, scale(6)),
                    }}
                  />
                  <div
                    className={s.cameraLens}
                    style={{
                      width: Math.max(4, scale(8)),
                      height: Math.max(4, scale(8)),
                    }}
                  />
                </div>

                <div
                  className={s.homeIndicator}
                  style={{
                    bottom: Math.max(3, scale(6)),
                    width: Math.max(36, scale(96)),
                    height: Math.max(2, scale(4)),
                    borderRadius: scale(2),
                  }}
                />
              </>
            )}
            <div style={{ borderRadius: 'inherit', overflow: 'hidden', width: '100%', height: '100%', position: 'relative', isolation: 'isolate' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. iPhone with Notch (iPhone 13, 14)
  if (frameType === 'iphone-notch' || profile.id.includes('iphone')) {
    const chassisPadding = Math.max(3, scale(9));
    const chassisR = Math.max(8, scale(36));
    const screenR = Math.max(6, scale(28));
    const notchW = Math.max(42, scale(100));
    const notchH = Math.max(7, scale(16));
    const notchR = Math.max(3, scale(7));

    return (
      <div className={s.frameContainer}>
        <div
          className={s.iphone15Chassis}
          style={{
            padding: chassisPadding,
            borderRadius: chassisR,
          }}
        >
          <div className={s.iphone15Screen} style={{ borderRadius: screenR, overflow: 'hidden', isolation: 'isolate' }}>
            {isPortrait && (
              <>
                <div
                  className={s.iphoneNotch}
                  style={{
                    width: notchW,
                    height: notchH,
                    borderRadius: `0 0 ${notchR}px ${notchR}px`,
                  }}
                >
                  <div
                    className={s.notchSpeaker}
                    style={{
                      width: Math.max(16, scale(36)),
                      height: Math.max(2, scale(2.5)),
                    }}
                  />
                </div>
                <div
                  className={s.homeIndicator}
                  style={{
                    bottom: Math.max(3, scale(6)),
                    width: Math.max(36, scale(96)),
                    height: Math.max(2, scale(4)),
                    borderRadius: scale(2),
                  }}
                />
              </>
            )}
            <div style={{ borderRadius: 'inherit', overflow: 'hidden', width: '100%', height: '100%', position: 'relative', isolation: 'isolate' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Android (Pixel 8, Galaxy S23, A54)
  if (frameType === 'android' || profile.category === 'phone') {
    const chassisPadding = Math.max(3, scale(8));
    const chassisR = Math.max(8, scale(32));
    const screenR = Math.max(6, scale(26));
    const punchSize = Math.max(4, scale(8));

    return (
      <div className={s.frameContainer}>
        <div
          className={s.androidChassis}
          style={{
            padding: chassisPadding,
            borderRadius: chassisR,
          }}
        >
          <div className={s.androidScreen} style={{ borderRadius: screenR, overflow: 'hidden', isolation: 'isolate' }}>
            {isPortrait && (
              <>
                <div
                  className={s.androidPunchHole}
                  style={{
                    top: Math.max(3, scale(6)),
                    width: punchSize,
                    height: punchSize,
                  }}
                />
                <div
                  className={s.homeIndicator}
                  style={{
                    bottom: Math.max(3, scale(5)),
                    width: Math.max(28, scale(64)),
                    height: Math.max(2, scale(3)),
                    borderRadius: scale(2),
                  }}
                />
              </>
            )}
            <div style={{ borderRadius: 'inherit', overflow: 'hidden', width: '100%', height: '100%', position: 'relative', isolation: 'isolate' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Tablet / iPad (Rectangular with subtle, clean rounded corners — NOT oval!)
  if (frameType === 'ipad' || profile.category === 'tablet') {
    const chassisPadding = Math.max(4, scale(11));
    // Notice: subtle corner radius matching real iPad proportions, NEVER oval
    const chassisR = Math.max(5, scale(14));
    const screenR = Math.max(3, scale(7));
    const camSize = Math.max(3, scale(5));

    return (
      <div className={s.frameContainer}>
        <div
          className={s.tabletChassis}
          style={{
            padding: chassisPadding,
            borderRadius: chassisR,
          }}
        >
          {isPortrait ? (
            <div
              className={s.tabletCameraDot}
              style={{
                top: Math.max(2, Math.round(chassisPadding * 0.35)),
                left: '50%',
                transform: 'translateX(-50%)',
                width: camSize,
                height: camSize,
              }}
            />
          ) : (
            <div
              className={s.tabletCameraDot}
              style={{
                top: '50%',
                left: Math.max(2, Math.round(chassisPadding * 0.35)),
                transform: 'translateY(-50%)',
                width: camSize,
                height: camSize,
              }}
            />
          )}

          <div className={s.tabletScreen} style={{ borderRadius: screenR, overflow: 'hidden', isolation: 'isolate' }}>
            {isPortrait && (
              <div
                className={s.homeIndicator}
                style={{
                  bottom: Math.max(3, scale(5)),
                  width: Math.max(36, scale(90)),
                  height: Math.max(2, scale(4)),
                  borderRadius: scale(2),
                }}
              />
            )}
            <div style={{ borderRadius: 'inherit', overflow: 'hidden', width: '100%', height: '100%', position: 'relative', isolation: 'isolate' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Laptop / MacBook Pro
  if (frameType === 'laptop' || profile.category === 'laptop') {
    const sidePadding = Math.max(4, scale(8));
    const topBezelH = Math.max(7, scale(14));
    const bottomBezelH = Math.max(6, scale(12));
    const lidR = Math.max(4, scale(8));
    const hingeH = Math.max(2, scale(3));
    const deckH = Math.max(7, scale(13));
    const deckOverhang = Math.max(12, scale(28));
    const camSize = Math.max(3, scale(5));
    const ledSize = Math.max(1.5, scale(2.5));
    const scoopW = Math.max(24, scale(50));
    const scoopH = Math.max(2.5, scale(4));

    const lidBg = finish === 'silver'
      ? 'linear-gradient(180deg, #b8bac4 0%, #989ba6 100%)'
      : finish === 'midnight'
      ? 'linear-gradient(180deg, #1e2634 0%, #10151f 100%)'
      : 'linear-gradient(180deg, #303238 0%, #1c1d22 100%)';
    const deckBg = finish === 'silver'
      ? 'linear-gradient(180deg, #dcdfe6 0%, #b4b7c2 45%, #9699a4 100%)'
      : finish === 'midnight'
      ? 'linear-gradient(180deg, #242f40 0%, #151c27 45%, #0e121a 100%)'
      : 'linear-gradient(180deg, #4f5159 0%, #303238 45%, #1c1d21 100%)';

    return (
      <div className={s.frameContainer}>
        <div className={s.laptopChassis}>
          {/* Lid (Display Assembly) */}
          <div
            className={s.laptopLid}
            style={{
              borderRadius: `${lidR}px ${lidR}px 0 0`,
              paddingLeft: sidePadding,
              paddingRight: sidePadding,
              paddingTop: 0,
              paddingBottom: 0,
              background: lidBg,
            }}
          >
            {/* Top Bezel with Camera and Green LED */}
            <div className={s.laptopTopBezel} style={{ height: topBezelH }}>
              <div className={s.laptopCameraGroup}>
                <div
                  className={s.macWebcam}
                  style={{ width: camSize, height: camSize }}
                />
                <div
                  className={s.macLed}
                  style={{ width: ledSize, height: ledSize }}
                />
              </div>
            </div>

            {/* Screen */}
            <div
              className={s.laptopScreen}
              style={{
                borderRadius: `${Math.max(2, scale(4))}px ${Math.max(2, scale(4))}px 0 0`,
              }}
            >
              {children}
            </div>

            {/* Bottom Bezel with MacBook Pro subtle text */}
            <div className={s.laptopBottomBezel} style={{ height: bottomBezelH }}>
              <span
                className={s.laptopLogoText}
                style={{ fontSize: Math.max(6, scale(8)) }}
              >
                MacBook Pro
              </span>
            </div>
          </div>

          {/* Hinge bar */}
          <div
            className={s.laptopHinge}
            style={{
              width: '75%',
              height: hingeH,
            }}
          />

          {/* Laptop Base Deck */}
          <div
            className={s.laptopDeck}
            style={{
              width: `calc(100% + ${deckOverhang}px)`,
              height: deckH,
              background: deckBg,
            }}
          >
            <div
              className={s.deckNotchScoop}
              style={{
                width: scoopW,
                height: scoopH,
                borderRadius: `0 0 ${Math.max(2, scale(3))}px ${Math.max(2, scale(3))}px`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 7. Desktop / Studio Display
  if (frameType === 'desktop' || profile.category === 'desktop') {
    const bezelWidth = Math.max(3, scale(6));
    const chinH = Math.max(6, scale(14));
    const monitorR = Math.max(2, scale(5));
    const neckW = Math.max(14, scale(32));
    const neckH = Math.max(8, scale(16));
    const baseW = Math.max(50, scale(105));
    const baseH = Math.max(3, scale(6));

    return (
      <div className={s.frameContainer}>
        <div className={s.desktopChassis}>
          <div
            className={s.desktopMonitor}
            style={{
              borderWidth: `${bezelWidth}px ${bezelWidth}px ${chinH}px ${bezelWidth}px`,
              borderRadius: `${monitorR}px ${monitorR}px 0 0`,
            }}
          >
            <div className={s.desktopScreen}>
              {children}
            </div>
            <div
              className={s.desktopAppleLogo}
              style={{
                bottom: -Math.max(4, Math.round(chinH * 0.7)),
                width: Math.max(3, scale(6)),
                height: Math.max(3, scale(6)),
              }}
            />
          </div>
          <div
            className={s.desktopStandNeck}
            style={{
              width: neckW,
              height: neckH,
            }}
          />
          <div
            className={s.desktopStandBase}
            style={{
              width: baseW,
              height: baseH,
            }}
          />
        </div>
      </div>
    );
  }

  // Default fallback
  return <div className={s.screenClip}>{children}</div>;
}
