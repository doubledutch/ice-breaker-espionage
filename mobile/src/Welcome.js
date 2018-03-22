/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { PureComponent } from 'react'
import ReactNative, {
  Image, Platform, ScrollView, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import Box from './Box'
import Button from './Button'
import Header from './Header'
import Text from './Text'
import Carousel from './Carousel'
import Smiley from './Smiley'
import client, { Color } from '@doubledutch/rn-client'
import colors from './colors'

const helpTexts = [
  "We've detected some target agents in your area. Your mission, should you choose to accept it, is to avoid detection and eliminate the rival agents.",
  "Once you accept your mission, you will choose your method that target agents must use when attempting to eliminate you from the mission. After this selection, you'll be sent your first target.",
  "After eliminating the target agent, mark your victory by scanning the agent's secret code with your phone. Your next target will be assigned after this confirmation.",
  "Are you ready?"
]

export default class Welcome extends PureComponent {
  constructor() {
    super()
    this.state = {
      showHelp: true,
      canAccept: false
    }
  }

  render() {
    const { showHelp, canAccept } = this.state
    if (showHelp) {
      return (
        <View style={s.buttonBottomContainer}>
          <View>
            <Text style={s.welcome}>Welcome, Agent {client.currentUser.lastName || client.currentUser.firstName}</Text>
            <Carousel texts={helpTexts} onStepChange={this._onStepChange} style={s.carousel} />
          </View>
          <Button text="ACCEPT MISSION" onPress={this._accept} disabled={!canAccept} style={s.bottomButton} />
        </View>
      )
    }

    return this.renderMethodSelector()
  }

  _onStepChange = ({step, stepCount}) => this.setState({canAccept: step === stepCount - 1})
  _accept = () => this.setState({showHelp: false})

  renderMethodSelector() {
    const { killMethods } = this.props
    return (
      <View style={s.buttonBottomContainer}>
        <View>
          <Header text="Select Elimination Method" />
          <View style={s.killMethodsContainer}>
            <Text>Choose a method that target agents must use to eliminate you.</Text>
              <View style={s.killMethods}>
                { killMethods.map((m,i) => (
                  <TouchableOpacity key={i} onPress={() => this._selectKillMethod(i)} style={s.killMethod}>
                    <Box style={[s.killMethodBox, this.state.killMethod === i ? s.highlighted : null]}>
                      {this.renderPhoto(m)}
                      <Text style={s.killdes}>{m.description}</Text>
                    </Box>
                  </TouchableOpacity>
                )) }
              </View>
          </View>
        </View>
        <Button text="NEXT" style={s.bottomButton} onPress={this._confirmKillMethod} disabled={this.state.killMethod == null} />
      </View>
    )
  }

  _selectKillMethod = killMethod => {
    this.setState({killMethod})
  }

  renderPhoto = (m) => {
    if (this.props.height > 650){
      if (m.title === '😄') return <Smiley size={50} style={s.killMethodTitleComponent} />
      const image = killMethodImages[m.title]
      if (image) return <Image source={image} style={[s.killMethodTitleComponent, s.killMethodTitleImage]} />
      return (
        <Text style={s.killMethodTitle}>{m.title}</Text>
      )
    }
  }

  _confirmKillMethod = () => {
    this.props.db.setPlayerKillMethod(`${this.state.killMethod}`)
  }
}

const killMethodImages = {
  '📸': {uri: 'data:image/png;base64,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'},
  '📇': {uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGoAAAA1CAYAAACp+X61AAAAAXNSR0IArs4c6QAABRhJREFUeAHtW11oFFcU/ibbjdFNk93ENppGDQaNP2ANGkQpWG1L2rwIthRf/IEEUbFPfRB8KW2ffJRC60Ptjz5UtEJLaWgQ0pZaS42lIsHWQiRim2jIurtJNjE/m3HOyDS7m7kzd3YvQzZ7DmxmZ+6557vzfXvn3nvmRtMNA9u8Z6Bk3reQG2gywEIVyA+BhWKhCoSBAmkm96gCEeqZfNpJ08Vu3McP+Bu30I+HGMED40O2DM+ixvhsQi1exzo0YwU0s4T/5MKAlsv0fAIpnMXvOINrGNKTUrhLtRCOYAfasA2LEJCqw06zDHgWqgN/4T104j89MRvFw7cXtEq8jxa0Yr2HWsC5Ly548i9U5wOH9tk23dMYdQpdaNcv5iwStYAEphgUi02eAekx6igu41u9Rxi59scxLP8pidC/KdMnWRfAwMsh9O9aYlvntP4L+rQYPsGbtuV8MZMBKaHo1y8SqTSewoaP44jcnsiIXNE7g4reOJ7/bRy3j4UxGZ47LlHMei2CE9idUZdP5jLg+uijMYl+/SKzEyndlwQkH5FRbMJgc2bAcTJBs7uX8JFwTKLHXeNZsQjp0HfawsLHIE0wruIdng2mE5b13bFH0RTcaXZHY5KsOfkSBmGxiRkQCkWLWVonOZk1cXDyscrcfAmL37dYbM09CoWijIPsYnZuWO9XCIsw2ewZEApFaSE3oym4rMn4ymDK4i00P+H0nHJ3bkbrJJqCyxj5upkT5nzLTGRnEFS1LzuuxZmwR1GC1c1oMRvbsMjNzfQRLXzTK8tgpvsX03ehUFYW3I0MWsw6iUVl5CNjspgysRaaj/DRJ3ujlHG4ebIaXlNIdvE1fhFiR4t5TSgUvU/qRVRYkQoCUzoiPRMIG5/y+9Mojc0ARh8teTyDkDHErfpmBM9dH8foqiCiTWWIrw0CmvitVA3KHfGKuVCYmXgLX+Ka3mfLTdmjFFZ8N4rlP48hMCm/+nlcFcC9veUY2BmCbqPXDq0eX+OgLWaxXxSOUfRm1s5qu5LY9u4g6q4kPYlEsUjgxk8T2PzhEIIjRu/LshcFmFluRXkqFIpen2dbw1fDaPwsgRLjkZePhf+ZRNMHQwhMZIrVYoOZD85CqisUivY40Otzy2p+HcPK70et07yPoYFprDk3/H8cwiJMNnsGhELREEJ7HMg0owOtvqROJDOo8WfZ1TGUDj/tVYRlM2xZrkV/FM76iBnaiPK5dh3jPYMoG5pWTpZmvAxe2j0O7dVaE8sJQNXK3wljPpR5zkxQo2m3EG1EWdKvXiSLlMWDKRODdyZZjNgfhY8+y512C7XX7bJOlR8PrX3F844k5Y0ogICuQtE9HN74BrZvb1Z+OxSzbWur8rgLMaCUUHTjx4+3Y88edaRSLIrJJseAMDMhqt7d/SfOn7+IaPSRyMXxenV1FfbvfxvNzU2OflyYyYBnoaj61NQ0Oju70NFxBYnE7FooM3TmWWVlBVpbX0NLy24Eg46TzcyKfGYykJNQFnf0X6V3eu/ixh830Xf3HuLROGKxp1udI5FKhKsiqG9Yia1bNqOxYbWRj+WVksWd12NeQnkFY//cGZCeTOQOwTVVMMBCqWDRhxgslA8kq4BgoVSw6EMMFsoHklVACBc0hZqtFmWfC+V+RO3nHqXi5+5DDBbKB5JVQLBQKlj0IQYL5QPJKiA4haSCRR9icI/ygWQVECyUChZ9iMFC+UCyCggWSgWLPsRgoXwgWQXEE3QzfObUmyeCAAAAAElFTkSuQmCC'},
}

const s = StyleSheet.create({
  carousel: {
    height: 200
  },
  welcome: {
    fontSize: 24,
    marginVertical: 15,
    marginLeft: 7
  },
  bottomButton: {
    marginHorizontal: 7,
    marginVertical: 20
  },
  buttonBottomContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  centerText: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 3
  },
  killMethodTitle: {
    fontSize: 50,
    textAlign: 'center',
    paddingBottom: 5
  },
  killMethodTitleComponent: {
    marginTop: 6,
    marginBottom: 15,
    height: 50,
  },
  killMethodTitleImage: {
    width: '100%',
    resizeMode: 'contain',
  },
  killdes: {
    padding: 0,
    marginBottom: 10,
  },
  killMethodsContainer: {
    padding: 7
  },
  killMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginRight: 5
  },
  killMethod: {
    paddingTop: 10,
    width: '49%',
  },
  highlighted: {
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  killMethodBox: {
    alignItems: 'center',
    minHeight: 175
  }
})