//
//  ProgressLine.swift
//  EduVerse360
//
//  Created by Ekta Rai on 11/07/2026.
//

import SwiftUI
struct ProgressLine: View {

    let isActive: Bool

    var body: some View {

        Rectangle()
            .fill(isActive ? Color.blue : Color.gray.opacity(0.3))
            .frame(height: 3)

    }
}
