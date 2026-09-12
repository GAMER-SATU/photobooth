//
//  ActPrinterView.swift
//  DuetPhotobooth
//
//  Act III: Model Nº 2 Mechanical Printer.
//  Features vibrating metal chassis, amber indicator lamp, mechanical slot
//  aperture, progressive strip feed with micro-jitter, photochemical emulsion
//  developing transition, and animated "TAKE IT" interaction.
//

import SwiftUI

struct ActPrinterView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    // Pulse animation for TAKE IT button
    @State private var takeItPulse: Bool = false
    
    var body: some View {
        ZStack {
            DuetTheme.machineDarker
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Top Header
                HeaderView(viewModel: viewModel)
                
                VStack(spacing: 20) {
                    Spacer(minLength: 10)
                    
                    // Printer Chassis Marquee & Indicator Lamp
                    PrinterChassisHeaderView(
                        isMotorActive: viewModel.isMotorActive,
                        isPrintReady: viewModel.isPrintReady
                    )
                    .padding(.horizontal, 20)
                    
                    // Mechanical Printer Slot Chamber
                    ZStack(alignment: .top) {
                        // Slot Background & Aperture
                        MechanicalSlotView()
                        
                        // Emerging Photo Strip
                        VStack {
                            PhotoStripView(
                                photos: viewModel.capturedPhotos,
                                mode: viewModel.sessionMode,
                                roomCode: viewModel.roomCode,
                                developmentProgress: viewModel.printProgress
                            )
                            .frame(width: 270)
                            // Slot Feed Motion: emerges downwards from slot
                            // At progress 0: hidden up behind slot
                            // At progress 1.0: fully displayed below slot
                            .offset(
                                x: viewModel.slotJitter,
                                y: -380 + (CGFloat(viewModel.printProgress) * 380)
                            )
                            .clipped()
                        }
                        .frame(width: 280, height: 420, alignment: .top)
                        // Mask so strip doesn't show above slot mouth
                        .offset(y: 36)
                        
                        // Slot Mouth Front Plate (hides strip until it leaves the slot)
                        SlotLipBezelView()
                    }
                    .frame(height: 480)
                    .offset(x: viewModel.isPrinterVibrating ? CGFloat.random(in: -0.8...0.8) : 0)
                    
                    Spacer()
                    
                    // Bottom Action Area: Status or "TAKE IT"
                    if viewModel.isPrintReady {
                        Button(action: {
                            viewModel.takeStrip()
                        }) {
                            HStack(spacing: 12) {
                                Image(systemName: "arrow.down.circle.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(DuetTheme.paper)
                                
                                Text("TAKE PHOTOSTRIP")
                                    .font(DuetTheme.headlineFont(size: 16))
                                    .tracking(2.5)
                                    .foregroundColor(DuetTheme.paper)
                                
                                Image(systemName: "hand.tap.fill")
                                    .font(.system(size: 16))
                                    .foregroundColor(DuetTheme.amberLamp)
                            }
                            .padding(.horizontal, 24)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(DuetTheme.crimson)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(DuetTheme.amberLamp, lineWidth: 1.5)
                                    )
                            )
                            .shadow(color: DuetTheme.crimson.opacity(0.8), radius: 10, x: 0, y: 4)
                            .scaleEffect(takeItPulse ? 1.03 : 0.98)
                        }
                        .onAppear {
                            withAnimation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                                takeItPulse = true
                            }
                        }
                        .padding(.bottom, 24)
                    } else {
                        // Printing in progress indicator
                        HStack(spacing: 8) {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: DuetTheme.amberLamp))
                                .scaleEffect(0.9)
                            
                            Text("MECHANICAL PRINTING • \(Int(viewModel.printProgress * 100))%")
                                .font(DuetTheme.codeFont(size: 11))
                                .tracking(1.8)
                                .foregroundColor(DuetTheme.amberLamp)
                        }
                        .padding(.bottom, 24)
                    }
                }
            }
        }
    }
}

// MARK: - Printer Chassis Header & Lamp
struct PrinterChassisHeaderView: View {
    let isMotorActive: Bool
    let isPrintReady: Bool
    
    var body: some View {
        HStack {
            ScrewRivetView()
            
            Spacer()
            
            VStack(spacing: 3) {
                Text("MODEL Nº 2 MECHANICAL PRINTER")
                    .font(DuetTheme.headlineFont(size: 13))
                    .tracking(2)
                    .foregroundColor(DuetTheme.cream)
                
                Text("AUTOMATIC PHOTOCHEMICAL CHEMICAL FEED")
                    .font(DuetTheme.codeFont(size: 8))
                    .foregroundColor(DuetTheme.paper.opacity(0.7))
            }
            
            Spacer()
            
            // Indicator Lamp
            HStack(spacing: 6) {
                Circle()
                    .fill(isPrintReady ? Color.green : (isMotorActive ? DuetTheme.amberLamp : DuetTheme.steel))
                    .frame(width: 10, height: 10)
                    .overlay(Circle().stroke(Color.white.opacity(0.6), lineWidth: 1))
                    .shadow(
                        color: isPrintReady ? Color.green.opacity(0.8) : (isMotorActive ? DuetTheme.amberLamp.opacity(0.8) : Color.clear),
                        radius: 5
                    )
                
                Text(isPrintReady ? "READY" : (isMotorActive ? "PRINTING" : "IDLE"))
                    .font(DuetTheme.codeFont(size: 9))
                    .foregroundColor(DuetTheme.paper)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(DuetTheme.machineDark)
            .cornerRadius(4)
            
            Spacer()
            
            ScrewRivetView()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(DuetTheme.machineDark)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(DuetTheme.steel.opacity(0.4), lineWidth: 1))
        )
    }
}

// MARK: - Mechanical Slot Aperture
struct MechanicalSlotView: View {
    var body: some View {
        VStack {
            // Slot Mouth (where paper exits)
            ZStack {
                Rectangle()
                    .fill(Color.black)
                    .frame(width: 290, height: 16)
                    .overlay(Rectangle().stroke(DuetTheme.steel.opacity(0.8), lineWidth: 1))
                
                // Deep inner shadow
                LinearGradient(
                    gradient: Gradient(colors: [Color.black, Color(white: 0.1), Color.black]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: 284, height: 12)
            }
            Spacer()
        }
    }
}

// MARK: - Slot Lip Bezel
struct SlotLipBezelView: View {
    var body: some View {
        VStack {
            ZStack {
                RoundedRectangle(cornerRadius: 3)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [DuetTheme.steel, DuetTheme.machineDark]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 310, height: 26)
                    .overlay(RoundedRectangle(cornerRadius: 3).stroke(DuetTheme.steel, lineWidth: 1.5))
                
                HStack {
                    ScrewRivetView()
                    Spacer()
                    Text("SLOT DISCHARGE")
                        .font(DuetTheme.codeFont(size: 8))
                        .tracking(1.5)
                        .foregroundColor(DuetTheme.paper.opacity(0.7))
                    Spacer()
                    ScrewRivetView()
                }
                .padding(.horizontal, 10)
            }
            Spacer()
        }
    }
}
