//
//  ProgressIndicatorView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 11/07/2026.
//

import SwiftUI

struct ProgressIndicatorView: View {
    let currentStep: Int
    var body: some View {
        HStack {

                   ProgressCircle(number: 1,
                                  isActive: currentStep >= 1)

                   ProgressLine(isActive: currentStep >= 2)

                   ProgressCircle(number: 2,
                                  isActive: currentStep >= 2)

                   ProgressLine(isActive: currentStep >= 3)

                   ProgressCircle(number: 3,
                                  isActive: currentStep >= 3)

               }
               .padding(.horizontal)
    }
}

#Preview {
    ProgressIndicatorView(currentStep:1)
}
