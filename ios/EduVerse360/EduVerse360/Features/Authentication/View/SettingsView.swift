//
//  SettingsView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 14/07/2026.
//

import SwiftUI

struct SettingsView: View {
    enum Route : Hashable{
        case profile
    }
    @State private var path = NavigationPath()
    var body: some View {
        NavigationStack(path: $path){
        HStack() {
            Image(systemName: "gearshape.fill")
                .font(.largeTitle)
                .foregroundColor(.primary)
                .padding()
            
            Text("Settings View")
                .font(.title)
                .fontWeight(.semibold)
        }
            Button(action: {
                path.append(Route.profile)
            } , label: {
                HStack() {
                    Image(systemName: "person")
                    
                    Text("Profile")
                }
                .foregroundColor(Color.white)
                .fontWeight(.bold)
                
                
            }
            )
            .padding()
            .background(Color.primary)
            .cornerRadius(20)
            
            .navigationDestination(for: Route.self) { route in

                ProfileView()

            }
        }
        
    }
}

#Preview {
    SettingsView()
}
