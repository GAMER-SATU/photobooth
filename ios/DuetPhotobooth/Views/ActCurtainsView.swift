//
//  ActCurtainsView.swift
//  DuetPhotobooth
//
//  Act I: Velvet crimson drapery, floating dust motes, and vintage
//  "ADMIT ONE" (Solo) and "ADMIT TWO" (Duet) admission tickets with
//  realistic scissor snip sound and tear physics.
//

import SwiftUI

struct ActCurtainsView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    // Floating dust mote positions
    @State private var moteOffsets: [CGSize] = (0..<16).map { _ in
        CGSize(width: CGFloat.random(in: -150...150), height: CGFloat.random(in: -300...300))
    }
    @State private var curtainsParted: Bool = false
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Curtains Base Fabric
                CurtainFabricView()
                
                // Floating Dust Motes
                ForEach(0..<16, id: \.self) { i in
                    Circle()
                        .fill(Color(white: 0.9).opacity(0.25))
                        .frame(width: CGFloat.random(in: 2...4), height: CGFloat.random(in: 2...4))
                        .offset(moteOffsets[i])
                }
                
                // Content Layer (Marquee & Tickets)
                VStack(spacing: 24) {
                    Spacer(minLength: 40)
                    
                    // Vintage Header & Marquee Plaque
                    VStack(spacing: 8) {
                        HStack(spacing: 8) {
                            Text("★")
                                .foregroundColor(DuetTheme.amberLamp)
                            Text("EST. 1974")
                                .font(DuetTheme.codeFont(size: 11))
                                .tracking(3)
                                .foregroundColor(DuetTheme.paper.opacity(0.8))
                            Text("★")
                                .foregroundColor(DuetTheme.amberLamp)
                        }
                        
                        Text("DUET PHOTOBOOTH")
                            .font(DuetTheme.headlineFont(size: 28))
                            .tracking(5)
                            .foregroundColor(DuetTheme.cream)
                            .shadow(color: Color.black.opacity(0.8), radius: 6, x: 0, y: 3)
                        
                        Text("AUTHENTIC PHOTOCHEMICAL EMULSION")
                            .font(DuetTheme.codeFont(size: 10))
                            .tracking(2.5)
                            .foregroundColor(DuetTheme.paper.opacity(0.7))
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.black.opacity(0.4))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(DuetTheme.amberLamp.opacity(0.3), lineWidth: 1)
                            )
                    )
                    
                    Spacer()
                    
                    // Tickets Selection Area
                    VStack(spacing: 18) {
                        Text("SELECT YOUR TICKET TO ENTER")
                            .font(DuetTheme.codeFont(size: 11))
                            .tracking(2)
                            .foregroundColor(DuetTheme.paper.opacity(0.9))
                        
                        // Solo Ticket (Admit One)
                        TicketView(
                            mode: .solo,
                            title: "ADMIT ONE",
                            subtitle: "SOLO SESSION",
                            serialNumber: "№ 08149",
                            isTorn: viewModel.isTearingTicket && viewModel.tornTicketMode == .solo
                        ) {
                            viewModel.selectTicket(mode: .solo)
                        }
                        
                        // Duet Ticket (Admit Two)
                        TicketView(
                            mode: .duet,
                            title: "ADMIT TWO",
                            subtitle: "DUET SESSION",
                            serialNumber: "№ 08150",
                            isTorn: viewModel.isTearingTicket && viewModel.tornTicketMode == .duet
                        ) {
                            viewModel.selectTicket(mode: .duet)
                        }
                    }
                    .padding(.horizontal, 24)
                    
                    Spacer(minLength: 40)
                    
                    // Bottom Instructions
                    HStack(spacing: 6) {
                        Image(systemName: "scissors")
                            .font(.system(size: 11))
                            .foregroundColor(DuetTheme.amberLamp)
                        Text("TAP TICKET TO SNIP & TEAR ADMISSION")
                            .font(DuetTheme.codeFont(size: 9))
                            .tracking(1.5)
                            .foregroundColor(DuetTheme.paper.opacity(0.6))
                    }
                    .padding(.bottom, 20)
                }
                .opacity(curtainsParted ? 0.0 : 1.0)
                
                // Left Curtain Flap (Parts on entry)
                CurtainFlapView(side: .left)
                    .frame(width: geo.size.width / 2)
                    .offset(x: curtainsParted ? -geo.size.width / 2 : 0)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                // Right Curtain Flap
                CurtainFlapView(side: .right)
                    .frame(width: geo.size.width / 2)
                    .offset(x: curtainsParted ? geo.size.width / 2 : 0)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            .onAppear {
                startMoteAnimation()
            }
            .onChange(of: viewModel.isTearingTicket) { isTearing in
                if isTearing {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                        withAnimation(.easeInOut(duration: 0.55)) {
                            curtainsParted = true
                        }
                    }
                }
            }
        }
    }
    
    private func startMoteAnimation() {
        withAnimation(Animation.easeInOut(duration: 8.0).repeatForever(autoreverses: true)) {
            moteOffsets = (0..<16).map { _ in
                CGSize(width: CGFloat.random(in: -160...160), height: CGFloat.random(in: -320...320))
            }
        }
    }
}

// MARK: - Ticket View Component
struct TicketView: View {
    let mode: SessionMode
    let title: String
    let subtitle: String
    let serialNumber: String
    let isTorn: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 0) {
                // Left Stub
                VStack(spacing: 4) {
                    Text("COUPON")
                        .font(DuetTheme.codeFont(size: 8))
                        .tracking(1.5)
                        .rotationEffect(Angle(degrees: -90))
                        .foregroundColor(DuetTheme.inkLight)
                    
                    Text(mode == .solo ? "1" : "2")
                        .font(DuetTheme.headlineFont(size: 20))
                        .foregroundColor(DuetTheme.crimson)
                }
                .frame(width: 50)
                .padding(.vertical, 14)
                .background(DuetTheme.paperHi)
                .offset(y: isTorn ? -16 : 0)
                .rotationEffect(Angle(degrees: isTorn ? -6 : 0))
                
                // Perforated Tear Line
                VStack(spacing: 3) {
                    ForEach(0..<10, id: \.self) { _ in
                        Rectangle()
                            .fill(DuetTheme.ink.opacity(0.3))
                            .frame(width: 1.5, height: 4)
                    }
                }
                .frame(width: 4)
                
                // Right Main Ticket Body
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            Text(title)
                                .font(DuetTheme.headlineFont(size: 16))
                                .tracking(2)
                                .foregroundColor(DuetTheme.ink)
                            
                            Spacer()
                            
                            Text(serialNumber)
                                .font(DuetTheme.codeFont(size: 9))
                                .foregroundColor(DuetTheme.crimson)
                        }
                        
                        Text(subtitle)
                            .font(DuetTheme.codeFont(size: 10))
                            .tracking(1)
                            .foregroundColor(DuetTheme.inkLight)
                    }
                    
                    Spacer()
                    
                    // Scissor Icon
                    Image(systemName: "scissors")
                        .font(.system(size: 15))
                        .foregroundColor(DuetTheme.crimson)
                        .padding(8)
                        .background(
                            Circle()
                                .stroke(DuetTheme.crimson.opacity(0.3), lineWidth: 1)
                        )
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(DuetTheme.paper)
                .offset(y: isTorn ? 16 : 0)
                .rotationEffect(Angle(degrees: isTorn ? 6 : 0))
            }
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(DuetTheme.amberLamp.opacity(0.6), lineWidth: 1.5)
            )
            .shadow(color: Color.black.opacity(0.4), radius: 8, x: 0, y: 4)
            .scaleEffect(isTorn ? 0.95 : 1.0)
            .animation(.spring(response: 0.35, dampingFraction: 0.6), value: isTorn)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Velvet Curtain Background & Flaps
struct CurtainFabricView: View {
    var body: some View {
        HStack(spacing: 0) {
            ForEach(0..<12, id: \.self) { _ in
                LinearGradient(
                    gradient: Gradient(colors: [
                        DuetTheme.curtainDark,
                        DuetTheme.curtainRed,
                        DuetTheme.curtainDark
                    ]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            }
        }
        .ignoresSafeArea()
    }
}

enum CurtainSide { case left, right }

struct CurtainFlapView: View {
    let side: CurtainSide
    
    var body: some View {
        HStack(spacing: 0) {
            ForEach(0..<6, id: \.self) { _ in
                LinearGradient(
                    gradient: Gradient(colors: [
                        DuetTheme.curtainDark,
                        DuetTheme.curtainRed,
                        DuetTheme.curtainDark
                    ]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            }
        }
        .shadow(color: Color.black.opacity(0.7), radius: 10, x: side == .left ? 6 : -6, y: 0)
        .ignoresSafeArea()
    }
}
