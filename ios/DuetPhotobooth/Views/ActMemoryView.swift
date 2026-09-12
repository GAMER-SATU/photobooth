//
//  ActMemoryView.swift
//  DuetPhotobooth
//
//  Act IV: Memory Desk.
//  Displays the final photobooth strip lying on a desk with paper drop animation,
//  red postmark stamp, AirPrint physical printing, Save to Photos,
//  and iOS Share Sheet.
//

import SwiftUI

struct ActMemoryView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    var body: some View {
        ZStack {
            // Desk Background (Warm dark wood / leather)
            DeskBackgroundView()
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HeaderView(viewModel: viewModel)
                
                // Toast Banner (e.g. "Saved strip to Photos!")
                if let msg = viewModel.saveNotificationMessage {
                    Text(msg)
                        .font(DuetTheme.codeFont(size: 11))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(DuetTheme.crimson.opacity(0.95))
                                .shadow(radius: 4)
                        )
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .padding(.top, 8)
                }
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        Spacer(minLength: 10)
                        
                        // Desk Display of the Finished Strip
                        ZStack(alignment: .bottomTrailing) {
                            PhotoStripView(
                                photos: viewModel.capturedPhotos,
                                mode: viewModel.sessionMode,
                                roomCode: viewModel.roomCode,
                                developmentProgress: nil // fully developed
                            )
                            .frame(width: 270)
                            .shadow(color: Color.black.opacity(0.45), radius: 14, x: 0, y: 8)
                            .rotationEffect(Angle(degrees: viewModel.hasDroppedMemoryPaper ? -1.5 : 0))
                            .scaleEffect(viewModel.hasDroppedMemoryPaper ? 1.0 : 0.85)
                            .offset(y: viewModel.hasDroppedMemoryPaper ? 0 : -50)
                            .opacity(viewModel.hasDroppedMemoryPaper ? 1.0 : 0.0)
                            
                            // Red Postmark Stamp
                            if viewModel.isPostmarkStamped {
                                PostmarkStampView(roomCode: viewModel.roomCode)
                                    .offset(x: 12, y: 16)
                                    .transition(.scale.combined(with: .opacity))
                            }
                        }
                        .padding(.top, 10)
                        
                        // Actions Palette
                        VStack(spacing: 12) {
                            // AirPrint Real Strip Button
                            Button(action: {
                                viewModel.printPhysicalStrip()
                            }) {
                                HStack(spacing: 10) {
                                    Image(systemName: "printer.fill")
                                        .font(.system(size: 17))
                                    
                                    Text("PRINT REAL STRIP")
                                        .font(DuetTheme.headlineFont(size: 15))
                                        .tracking(2)
                                }
                                .foregroundColor(DuetTheme.cream)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(DuetTheme.crimson)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(DuetTheme.amberLamp, lineWidth: 1.5)
                                        )
                                )
                                .shadow(color: DuetTheme.crimson.opacity(0.5), radius: 6, x: 0, y: 3)
                            }
                            
                            HStack(spacing: 12) {
                                // Save to Photos
                                Button(action: {
                                    viewModel.saveStripToLibrary()
                                }) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "square.and.arrow.down.fill")
                                            .font(.system(size: 14))
                                        Text("SAVE TO PHOTOS")
                                            .font(DuetTheme.codeFont(size: 11))
                                            .tracking(1)
                                    }
                                    .foregroundColor(DuetTheme.paper)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(DuetTheme.machineDark)
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(DuetTheme.steel.opacity(0.4), lineWidth: 1))
                                    )
                                }
                                
                                // Share Sheet
                                Button(action: {
                                    viewModel.shareStrip()
                                }) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "square.and.arrow.up.fill")
                                            .font(.system(size: 14))
                                        Text("SHARE")
                                            .font(DuetTheme.codeFont(size: 11))
                                            .tracking(1)
                                    }
                                    .foregroundColor(DuetTheme.paper)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(DuetTheme.machineDark)
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(DuetTheme.steel.opacity(0.4), lineWidth: 1))
                                    )
                                }
                            }
                            
                            // New Session Button
                            Button(action: {
                                viewModel.startOver()
                            }) {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.counterclockwise")
                                        .font(.system(size: 13))
                                    Text("START ANOTHER SESSION")
                                        .font(DuetTheme.codeFont(size: 11))
                                        .tracking(1.5)
                                }
                                .foregroundColor(DuetTheme.cream.opacity(0.8))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 11)
                                .background(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(DuetTheme.amberLamp.opacity(0.4), lineWidth: 1)
                                )
                            }
                        }
                        .padding(.horizontal, 28)
                        .padding(.bottom, 30)
                    }
                }
            }
        }
    }
}

// MARK: - Postmark Stamp
struct PostmarkStampView: View {
    let roomCode: String
    
    var body: some View {
        ZStack {
            // Outer dashed circle
            Circle()
                .strokeBorder(DuetTheme.stampRed.opacity(0.85), style: StrokeStyle(lineWidth: 1.5, dash: [4, 2]))
                .frame(width: 88, height: 88)
            
            // Inner circle
            Circle()
                .stroke(DuetTheme.stampRed.opacity(0.85), lineWidth: 1)
                .frame(width: 76, height: 76)
            
            VStack(spacing: 2) {
                Text("DUET BOOTH")
                    .font(DuetTheme.codeFont(size: 7))
                    .tracking(1)
                    .foregroundColor(DuetTheme.stampRed)
                
                Text("ARCHIVED")
                    .font(DuetTheme.headlineFont(size: 9))
                    .tracking(1.5)
                    .foregroundColor(DuetTheme.stampRed)
                
                Text(roomCode)
                    .font(DuetTheme.codeFont(size: 8))
                    .foregroundColor(DuetTheme.stampRed)
                
                Text(formattedDate())
                    .font(DuetTheme.codeFont(size: 7))
                    .foregroundColor(DuetTheme.stampRed)
            }
        }
        .rotationEffect(Angle(degrees: -12))
    }
    
    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd.MM.yy"
        return formatter.string(from: Date())
    }
}

// MARK: - Desk Background
struct DeskBackgroundView: View {
    var body: some View {
        RadialGradient(
            gradient: Gradient(colors: [
                Color(red: 0.18, green: 0.14, blue: 0.12),
                Color(red: 0.10, green: 0.08, blue: 0.06)
            ]),
            center: .center,
            startRadius: 50,
            endRadius: 500
        )
    }
}
