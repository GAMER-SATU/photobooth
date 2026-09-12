//
//  HeaderView.swift
//  DuetPhotobooth
//
//  Vintage top bar with title, room code badge, sound toggle,
//  and session restart button.
//

import SwiftUI

struct HeaderView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    var body: some View {
        HStack(spacing: 12) {
            // Title & Marquee Emblem
            HStack(spacing: 6) {
                Text("★")
                    .font(.system(size: 14))
                    .foregroundColor(DuetTheme.amberLamp)
                
                Text(viewModel.sessionMode == .solo ? "SOLO PHOTOBOOTH" : "DUET PHOTOBOOTH")
                    .font(DuetTheme.headlineFont(size: 15))
                    .tracking(2.5)
                    .foregroundColor(DuetTheme.cream)
            }
            
            Spacer()
            
            // Room Code Pill
            Text(viewModel.roomCode)
                .font(DuetTheme.codeFont(size: 11))
                .tracking(1.0)
                .foregroundColor(DuetTheme.paper)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    Capsule()
                        .fill(DuetTheme.machineDark.opacity(0.8))
                        .overlay(
                            Capsule()
                                .stroke(DuetTheme.steel.opacity(0.4), lineWidth: 1)
                        )
                )
            
            // Sound Toggle
            Button(action: {
                viewModel.isAudioEnabled.toggle()
            }) {
                Image(systemName: viewModel.isAudioEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill")
                    .font(.system(size: 14))
                    .foregroundColor(viewModel.isAudioEnabled ? DuetTheme.amberLamp : DuetTheme.inkLight)
                    .frame(width: 32, height: 32)
                    .background(
                        Circle()
                            .fill(DuetTheme.machineDark)
                            .overlay(Circle().stroke(DuetTheme.steel.opacity(0.3), lineWidth: 1))
                    )
            }
            
            // Restart Session (only if beyond curtains)
            if viewModel.currentAct != .curtains {
                Button(action: {
                    viewModel.startOver()
                }) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(DuetTheme.cream)
                        .frame(width: 32, height: 32)
                        .background(
                            Circle()
                                .fill(DuetTheme.machineDark)
                                .overlay(Circle().stroke(DuetTheme.steel.opacity(0.3), lineWidth: 1))
                        )
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            DuetTheme.machineDarker.opacity(0.95)
                .overlay(
                    Rectangle()
                        .frame(height: 1)
                        .foregroundColor(DuetTheme.steel.opacity(0.2)),
                    alignment: .bottom
                )
        )
    }
}
