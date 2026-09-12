//
//  LightboxView.swift
//  DuetPhotobooth
//
//  Vintage steel marquee lightbox with screw rivets, illuminated
//  "PHOTOS" sign, and 3-frame film spool counter.
//

import SwiftUI

struct LightboxView: View {
    let shotCount: Int // 0 to 3
    
    var body: some View {
        HStack {
            // Left Screw
            ScrewRivetView()
            
            Spacer()
            
            // Marquee Sign
            HStack(spacing: 8) {
                Text("★")
                    .font(.system(size: 13))
                    .foregroundColor(DuetTheme.amberLamp)
                
                Text("PHOTOS")
                    .font(DuetTheme.headlineFont(size: 18))
                    .tracking(4)
                    .foregroundColor(DuetTheme.cream)
                    .shadow(color: DuetTheme.amberLamp.opacity(0.6), radius: 6, x: 0, y: 0)
                
                Text("★")
                    .font(.system(size: 13))
                    .foregroundColor(DuetTheme.amberLamp)
            }
            
            Spacer()
            
            // Film Spool Shot Counter (3 dots)
            HStack(spacing: 6) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(i < shotCount ? DuetTheme.crimson : DuetTheme.steel.opacity(0.4))
                        .frame(width: 10, height: 10)
                        .overlay(
                            Circle()
                                .stroke(i < shotCount ? DuetTheme.amberLamp : DuetTheme.steel, lineWidth: 1)
                        )
                        .shadow(color: i < shotCount ? DuetTheme.crimson.opacity(0.8) : Color.clear, radius: 4)
                }
            }
            
            Spacer()
            
            // Right Screw
            ScrewRivetView()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            ZStack {
                LinearGradient(
                    gradient: Gradient(colors: [
                        DuetTheme.machineDark,
                        DuetTheme.machineDarker
                    ]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                
                RoundedRectangle(cornerRadius: 6)
                    .stroke(DuetTheme.steel.opacity(0.5), lineWidth: 1.5)
            }
        )
        .cornerRadius(6)
        .shadow(color: Color.black.opacity(0.5), radius: 4, x: 0, y: 2)
    }
}

struct ScrewRivetView: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [Color(white: 0.6), Color(white: 0.25)]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 12, height: 12)
                .overlay(Circle().stroke(Color.black.opacity(0.6), lineWidth: 0.5))
            
            // Slit
            Rectangle()
                .fill(Color.black.opacity(0.7))
                .frame(width: 8, height: 1.5)
                .rotationEffect(Angle(degrees: 45))
        }
    }
}
