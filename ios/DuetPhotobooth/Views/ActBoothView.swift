//
//  ActBoothView.swift
//  DuetPhotobooth
//
//  Act II: Photobooth Machine Bay.
//  Features live AVFoundation camera preview (solo 16:10 or duet 2-screen bay),
//  tone filter selectors, countdown & flash, developing bench for captions & stickers,
//  and trigger to start mechanical printing.
//

import SwiftUI

struct ActBoothView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    var body: some View {
        ZStack {
            // Machine Background
            DuetTheme.machineDarker
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Top Vintage Navigation Header
                HeaderView(viewModel: viewModel)
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        // Marquee Lightbox with 3-dot Spool Counter
                        LightboxView(shotCount: viewModel.capturedPhotos.count)
                            .padding(.horizontal, 16)
                            .padding(.top, 10)
                        
                        // Camera Bay
                        CameraBayView(viewModel: viewModel)
                            .padding(.horizontal, 16)
                        
                        // Tone Filter Selector (Original, Warm, Vintage, Grain, Mono, Noir)
                        ToneSelectorView(
                            activeFilter: viewModel.activeFilter,
                            onSelect: { filter in
                                viewModel.setFilter(filter)
                            }
                        )
                        .padding(.horizontal, 16)
                        
                        // Shutter Trigger Button (if under 3 shots)
                        if viewModel.capturedPhotos.count < 3 {
                            ShutterControlView(
                                isCapturing: viewModel.isCapturing,
                                shotsTaken: viewModel.capturedPhotos.count,
                                onSnap: {
                                    viewModel.startCountdownAndCapture()
                                }
                            )
                            .padding(.vertical, 8)
                        } else {
                            // All 3 shots complete -> Proceed to Printer Button
                            ProceedToPrinterButton {
                                viewModel.proceedToPrinter()
                            }
                            .padding(.vertical, 10)
                        }
                        
                        // Bench Section (Polaroids dropped out of the bay)
                        if !viewModel.capturedPhotos.isEmpty {
                            DevelopingBenchView(viewModel: viewModel)
                                .padding(.horizontal, 16)
                                .padding(.bottom, 30)
                        }
                    }
                }
            }
            
            // Full-screen Flash Overlay
            if viewModel.isFlashing {
                Color.white
                    .ignoresSafeArea()
                    .transition(.opacity)
            }
        }
    }
}

// MARK: - Camera Bay (Solo vs Duet)
struct CameraBayView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    var body: some View {
        ZStack {
            // Machine Bezel Outer Frame
            RoundedRectangle(cornerRadius: 10)
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [DuetTheme.steel, DuetTheme.machineDark]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(DuetTheme.steel.opacity(0.8), lineWidth: 2)
                )
            
            // Camera Screen Interior
            VStack(spacing: 6) {
                if viewModel.sessionMode == .solo {
                    // Solo Centered Bay (16:10)
                    CameraScreenBox(viewModel: viewModel, label: "YOU • SOLO BAY")
                } else {
                    // Duet Split Screen Bay (2-person)
                    HStack(spacing: 8) {
                        CameraScreenBox(viewModel: viewModel, label: "YOU")
                        
                        // Second Bay (Partner or local mirror)
                        DuetPartnerScreenBox(viewModel: viewModel)
                    }
                }
            }
            .padding(10)
        }
        .shadow(color: Color.black.opacity(0.6), radius: 8, x: 0, y: 4)
    }
}

// MARK: - Camera Screen Box with Live Preview, Filter, and Countdown
struct CameraScreenBox: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    let label: String
    
    var body: some View {
        ZStack {
            // Black screen backing
            Color.black
            
            // AVFoundation Camera Live Preview
            CameraPreviewView(cameraManager: viewModel.cameraManager)
                .clipped()
            
            // Live Tone Tint Approximation
            TonePreviewOverlay(filter: viewModel.activeFilter)
            
            // Viewfinder Grid Overlay
            ViewfinderReticleView()
            
            // Top Badge
            VStack {
                HStack {
                    Text(label)
                        .font(DuetTheme.codeFont(size: 9))
                        .foregroundColor(DuetTheme.amberLamp)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.black.opacity(0.6))
                        .cornerRadius(3)
                    
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 6, height: 6)
                        Text("LIVE")
                            .font(DuetTheme.codeFont(size: 8))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(3)
                }
                .padding(6)
                
                Spacer()
                
                // Countdown Overlay
                if let count = viewModel.countdownNumber {
                    Text("\(count)")
                        .font(.system(size: 80, weight: .black, design: .monospaced))
                        .foregroundColor(DuetTheme.cream)
                        .shadow(color: DuetTheme.amberLamp, radius: 15, x: 0, y: 0)
                        .scaleEffect(1.1)
                        .animation(.easeInOut(duration: 0.3), value: count)
                    
                    Spacer()
                }
            }
        }
        .aspectRatio(16/10, contentMode: .fit)
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(DuetTheme.steel.opacity(0.5), lineWidth: 1)
        )
    }
}

// MARK: - Duet Partner Screen
struct DuetPartnerScreenBox: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    var body: some View {
        ZStack {
            Color.black
            
            // Secondary companion mirror or partner placeholder
            CameraPreviewView(cameraManager: viewModel.cameraManager)
                .clipped()
            
            TonePreviewOverlay(filter: viewModel.activeFilter)
            ViewfinderReticleView()
            
            VStack {
                HStack {
                    Text("PARTNER BAY")
                        .font(DuetTheme.codeFont(size: 9))
                        .foregroundColor(DuetTheme.paper)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.black.opacity(0.6))
                        .cornerRadius(3)
                    
                    Spacer()
                }
                .padding(6)
                
                Spacer()
                
                if let count = viewModel.countdownNumber {
                    Text("\(count)")
                        .font(.system(size: 60, weight: .black, design: .monospaced))
                        .foregroundColor(DuetTheme.cream)
                        .shadow(color: DuetTheme.amberLamp, radius: 10)
                    
                    Spacer()
                }
            }
        }
        .aspectRatio(16/10, contentMode: .fit)
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(DuetTheme.steel.opacity(0.5), lineWidth: 1)
        )
    }
}

// MARK: - Viewfinder Reticle
struct ViewfinderReticleView: View {
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Center crosshairs
                Path { p in
                    let midX = geo.size.width / 2
                    let midY = geo.size.height / 2
                    p.move(to: CGPoint(x: midX - 10, y: midY))
                    p.addLine(to: CGPoint(x: midX + 10, y: midY))
                    p.move(to: CGPoint(x: midX, y: midY - 10))
                    p.addLine(to: CGPoint(x: midX, y: midY + 10))
                }
                .stroke(Color.white.opacity(0.25), lineWidth: 1)
                
                // Corner crop marks
                let w = geo.size.width
                let h = geo.size.height
                Path { p in
                    // Top-left
                    p.move(to: CGPoint(x: 12, y: 20))
                    p.addLine(to: CGPoint(x: 12, y: 12))
                    p.addLine(to: CGPoint(x: 20, y: 12))
                    // Top-right
                    p.move(to: CGPoint(x: w - 20, y: 12))
                    p.addLine(to: CGPoint(x: w - 12, y: 12))
                    p.addLine(to: CGPoint(x: w - 12, y: 20))
                    // Bottom-left
                    p.move(to: CGPoint(x: 12, y: h - 20))
                    p.addLine(to: CGPoint(x: 12, y: h - 12))
                    p.addLine(to: CGPoint(x: 20, y: h - 12))
                    // Bottom-right
                    p.move(to: CGPoint(x: w - 20, y: h - 12))
                    p.addLine(to: CGPoint(x: w - 12, y: h - 12))
                    p.addLine(to: CGPoint(x: w - 12, y: h - 20))
                }
                .stroke(Color.white.opacity(0.3), lineWidth: 1.5)
            }
        }
    }
}

// MARK: - Live Tone Tint Overlay
struct TonePreviewOverlay: View {
    let filter: FilterType
    
    var body: some View {
        Group {
            switch filter {
            case .original:
                Color.clear
            case .warm:
                Color(red: 0.9, green: 0.6, blue: 0.2).opacity(0.18)
            case .vintage:
                Color(red: 0.8, green: 0.7, blue: 0.5).opacity(0.25)
            case .grain:
                Color.black.opacity(0.12)
            case .mono, .noir:
                // Black & white tint representation in live overlay
                Color.black.opacity(0.25)
            }
        }
    }
}

// MARK: - Tone Filter Selector Bar
struct ToneSelectorView: View {
    let activeFilter: FilterType
    let onSelect: (FilterType) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("PHOTOCHEMICAL TONE")
                .font(DuetTheme.codeFont(size: 10))
                .foregroundColor(DuetTheme.cream.opacity(0.8))
                .tracking(1.5)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(FilterType.allCases) { filter in
                        Button(action: { onSelect(filter) }) {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(filter.swatchColor)
                                    .frame(width: 12, height: 12)
                                    .overlay(Circle().stroke(Color.white.opacity(0.4), lineWidth: 1))
                                
                                Text(filter.title.uppercased())
                                    .font(DuetTheme.codeFont(size: 10))
                                    .foregroundColor(activeFilter == filter ? DuetTheme.cream : DuetTheme.paper.opacity(0.7))
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 7)
                            .background(
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(activeFilter == filter ? DuetTheme.crimson.opacity(0.8) : DuetTheme.machineDark)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 6)
                                            .stroke(activeFilter == filter ? DuetTheme.amberLamp : DuetTheme.steel.opacity(0.4), lineWidth: 1)
                                    )
                            )
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Shutter Button Control
struct ShutterControlView: View {
    let isCapturing: Bool
    let shotsTaken: Int
    let onSnap: () -> Void
    
    var body: some View {
        Button(action: onSnap) {
            HStack(spacing: 12) {
                // Mechanical red lens button
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [DuetTheme.steel, Color(white: 0.2)]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 54, height: 54)
                        .shadow(color: Color.black.opacity(0.4), radius: 4)
                    
                    Circle()
                        .fill(
                            RadialGradient(
                                gradient: Gradient(colors: [Color.red, DuetTheme.crimson]),
                                center: .center,
                                startRadius: 2,
                                endRadius: 22
                            )
                        )
                        .frame(width: 44, height: 44)
                        .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 1.5))
                    
                    Image(systemName: "camera.fill")
                        .font(.system(size: 18))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(isCapturing ? "GET READY..." : "SNAP FRAME \(shotsTaken + 1) OF 3")
                        .font(DuetTheme.headlineFont(size: 15))
                        .tracking(1.5)
                        .foregroundColor(DuetTheme.cream)
                    
                    Text(isCapturing ? "Hold still for double flash" : "3-second countdown timer")
                        .font(DuetTheme.codeFont(size: 10))
                        .foregroundColor(DuetTheme.paper.opacity(0.7))
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(DuetTheme.amberLamp)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(DuetTheme.machineDark)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(DuetTheme.steel.opacity(0.5), lineWidth: 1)
                    )
            )
        }
        .disabled(isCapturing)
        .opacity(isCapturing ? 0.7 : 1.0)
    }
}

// MARK: - Proceed to Printer Button
struct ProceedToPrinterButton: View {
    let onProceed: () -> Void
    
    var body: some View {
        Button(action: onProceed) {
            HStack(spacing: 12) {
                Image(systemName: "printer.fill")
                    .font(.system(size: 20))
                    .foregroundColor(DuetTheme.amberLamp)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("PRINT PHOTOSTRIP")
                        .font(DuetTheme.headlineFont(size: 16))
                        .tracking(2)
                        .foregroundColor(DuetTheme.cream)
                    
                    Text("Proceed to Model Nº 2 mechanical printer")
                        .font(DuetTheme.codeFont(size: 10))
                        .foregroundColor(DuetTheme.paper.opacity(0.8))
                }
                
                Spacer()
                
                Text("★")
                    .font(.system(size: 16))
                    .foregroundColor(DuetTheme.amberLamp)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [DuetTheme.crimson, Color(red: 0.35, green: 0.05, blue: 0.05)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(DuetTheme.amberLamp, lineWidth: 1.5)
                    )
            )
            .shadow(color: DuetTheme.crimson.opacity(0.6), radius: 8, x: 0, y: 3)
        }
    }
}

// MARK: - Developing Bench View
struct DevelopingBenchView: View {
    @ObservedObject var viewModel: PhotoboothViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("DEVELOPING BENCH")
                    .font(DuetTheme.codeFont(size: 11))
                    .foregroundColor(DuetTheme.amberLamp)
                    .tracking(2)
                
                Spacer()
                
                // Photo selector tabs
                HStack(spacing: 6) {
                    ForEach(0..<viewModel.capturedPhotos.count, id: \.self) { i in
                        Button("FRAME \(i + 1)") {
                            viewModel.activeBenchIndex = i
                        }
                        .font(DuetTheme.codeFont(size: 9))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            viewModel.activeBenchIndex == i ? DuetTheme.crimson : DuetTheme.machineDark
                        )
                        .foregroundColor(DuetTheme.cream)
                        .cornerRadius(4)
                    }
                }
            }
            
            // Active Polaroid on Bench
            PolaroidCardView(
                photoIndex: viewModel.activeBenchIndex,
                viewModel: viewModel
            )
        }
    }
}
