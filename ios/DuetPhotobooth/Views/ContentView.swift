//
//  ContentView.swift
//  DuetPhotobooth
//
//  Main container view orchestrating transitions between
//  Act I (Curtains), Act II (Booth), Act III (Printer), and Act IV (Memory).
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = PhotoboothViewModel()
    
    var body: some View {
        ZStack {
            DuetTheme.machineDarker
                .ignoresSafeArea()
            
            switch viewModel.currentAct {
            case .curtains:
                ActCurtainsView(viewModel: viewModel)
                    .transition(.opacity)
            case .booth:
                ActBoothView(viewModel: viewModel)
                    .transition(.opacity.combined(with: .scale))
            case .printer:
                ActPrinterView(viewModel: viewModel)
                    .transition(.opacity)
            case .memory:
                ActMemoryView(viewModel: viewModel)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.4), value: viewModel.currentAct)
        .preferredColorScheme(.dark)
    }
}

#if DEBUG
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
#endif
