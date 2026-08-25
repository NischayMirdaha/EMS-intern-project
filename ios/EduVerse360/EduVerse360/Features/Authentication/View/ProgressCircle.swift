//
//  ProgressCircle.swift
//  EduVerse360
//
//  Created by Ekta Rai on 11/07/2026.
//
import SwiftUI

struct ProgressCircle: View {

    let number: Int
    let isActive: Bool

    var body: some View {

        ZStack {

            Circle()
                .fill(isActive ? Color.blue : Color.gray.opacity(0.3))
                .frame(width: 35, height: 35)

            Text("\(number)")
                .foregroundColor(.white)
                .bold()

        }

    }
}
