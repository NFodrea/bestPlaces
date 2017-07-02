/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    ScrollView,
    Animated,
    Image,
    Dimensions
} from "react-native";

import MapView from "react-native-maps";

//loading some images from the web for our cards
const Images = [
    {uri: "https://i.imgur.com/66CAH1z.jpg"},
    {uri: "https://i.imgur.com/hlekmLV.jpg"},
    {uri: "https://i.imgur.com/bapmxQV.jpg"},
    {uri: "https://i.imgur.com/jAk7NV9.jpg"},
    {uri: "https://i.imgur.com/feiM3Kl.jpg"}
]

//get the height and width of the screen
const {width, height} = Dimensions.get("window");

//set card height to 1/4 the height of the screen
const CARD_HEIGHT = height / 4;
//set card with to the card height -20px
const CARD_WIDTH = CARD_HEIGHT - 20;


export default class bestPlaces extends Component {
    state = {
        markers: [
            {
                coordinate: {
                    latitude: 39.7652566,
                    longitude: -86.15939709999998,
                },
                title: "Circle Center Mall",
                description: "This is a great place to shop",
                image: Images[0],
            },
            {
                coordinate: {
                    latitude: 39.7684983,
                    longitude: -86.15650349999999,
                },
                title: "Indianapolis City Market",
                description: "Summer Farmers' Market from May - October",
                image: Images[1],
            },
            {
                coordinate: {
                    latitude: 39.7758768,
                    longitude: -86.16490090000002,
                },
                title: "Canal Walk",
                description: "Take a walk along the 1.5 mile long Downtown Canal Walk.",
                image: Images[2],
            },
            {
                coordinate: {
                    latitude: 39.7671461,
                    longitude: -86.159895,
                },
                title: "Indianapolis Artsgarden",
                description: "Check out the numerous concerts and performances in the Indianapolis Artsgarden",
                image: Images[3],
            },
            {
                coordinate: {
                    latitude: 39.966762,
                    longitude: -86.00863900000002,
                },
                title: "Launch Fishers",
                description: "Check out the numerous concerts and performances in the Indianapolis Artsgarden",
                image: Images[4],
            },
        ],
        //define initial map region and zoom level
        region: {
            //lat and long for Indianapolis
            latitude: 39.7683333,
            longitude: -86.1580556,
            /*            -----------------------------------------------------------------
             latitudeDelta  The amount of north-to-south distance (measured in degrees) to display on the map. Unlike                   longitudinal distances, which vary based on the latitude, one degree of latitude is always approximately 111               kilometers (69 miles).
             -----------------------------------------------------------------*/
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        },
    };

    componentWillMount() {
        this.index = 0;
        this.animation = new Animated.Value(0);
    }

    componentDidMount() {
        //the coordinate for the item may be out of range, this will center the map on the focused item.
        //detect when scrolling has stopped then animate
        this.animation.addListener(({value}) => {
            let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
            if (index >= this.state.markers.length) {
                index = this.state.markers.length - 1;
            }
            if (index <= 0) {
                index = 0;
            }

            //this method should be refactored later with a true debounce timer. importing lodash is a decent option,but I tried to keep this as pure JS and React as possible
            clearTimeout(this.regionTimeout);
            this.regionTimeout = setTimeout(() => {
                if (this.index !== index) { //check to see if we have moved to a different region
                    this.index = index;
                    const {coordinate} = this.state.markers[index];
                    this.map.animateToRegion(
                        {
                            ...coordinate,
                            //region was a central latitude/longitude so set coordinates to the marker we want to focus on and use the same latitudeDelta/longitudeDelta that we started with.
                            latitudeDelta: this.state.region.latitudeDelta,
                            longitudeDelta: this.state.region.longitudeDelta,
                        },
                        350
                    );
                }
            }, 10);
        });
    }

    render() {
        const interpolations = this.state.markers.map((marker, index) => {
            // (index - 1) * CARD_WIDTH = What happens when the user scrolls past this to the left. (INACTIVE)
            // index * CARD_WIDTH = What happens when the user is focused on the specific card (ACTIVE)
            // (index + 1) * CARD_WIDTH = What happens when the user scrolls past on the right side (INACTIVE)
            const inputRange = [
                (index - 1) * CARD_WIDTH,
                index * CARD_WIDTH,
                ((index + 1) * CARD_WIDTH),
            ];
            // as a user scrolls closer to the enxt card start to shrink the previous ring and start growing the ring that is being scrolled to
            const scale = this.animation.interpolate({
                inputRange,
                outputRange: [1, 2.5, 1],
                extrapolate: "clamp",
            });
            // same idea here make the ring being scrolled to less transparent as we make the old ring more transparent
            const opacity = this.animation.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                // This will clamp the values of the outputRange at what the set value. Without the clamp the interpolate will calculate the rate of change and keep applying it. (if this isn't clamped our makers would eventually disappear).
                extrapolate: "clamp",
            });
            return {scale, opacity};
        });
        return (
            <View style={styles.container}>
                {/*render map to screen*/}
                <MapView
                    //adding a  ref for animation
                    ref={map => this.map = map}
                    initialRegion={this.state.region}
                    style={styles.container}
                >
                    {this.state.markers.map((marker, index) => {
                        const scaleStyle = {
                            transform: [
                                {
                                    scale: interpolations[index].scale,
                                },
                            ],
                        };
                        const opacityStyle = {
                            opacity: interpolations[index].opacity,
                        };
                        return (
                            <MapView.Marker key={index} coordinate={marker.coordinate}>
                                <Animated.View style={[styles.markerWrap, opacityStyle]}>
                                    <Animated.View style={[styles.ring, scaleStyle]}/>
                                    <View style={styles.marker}/>
                                </Animated.View>
                            </MapView.Marker>
                        );
                    })}
                </MapView>
                <Animated.ScrollView
                    // horizontal will make the ScrollView operate from left to right
                    horizontal
                    scrollEventThrottle={1}
                    // showsHorizontalScrollIndicator will hide the scrollbar
                    showsHorizontalScrollIndicator={false}
                    // snapToInterval is an IOS only property, on Android the scroll view will be smooth  and have no lock points on IOS it will lock to each card
                    snapToInterval={CARD_WIDTH}
                    // onScoll will automatically update this.animation with the x value of contentOffset. it sets the this.animation with how far the user has scrolled.
                    onScroll={Animated.event(
                        [
                            {
                                nativeEvent: {
                                    contentOffset: {
                                        x: this.animation,
                                    },
                                },
                            },
                        ],
                        {useNativeDriver: true}
                    )}
                    style={styles.scrollView}
                    contentContainerStyle={styles.endPadding}
                >
                    {/*render markers*/}
                    {/*map through the markers array and render a marker for each object*/}
                    {this.state.markers.map((marker, index) => (
                        <View style={styles.card} key={index}>
                            <Image
                                source={marker.image}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                            <View style={styles.textContent}>
                                <Text numberOfLines={1} style={styles.cardtitle}>{marker.title}</Text>
                                <Text numberOfLines={1} style={styles.cardDescription}>
                                    {marker.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </Animated.ScrollView>
            </View>
        );
    }

}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        position: "absolute",
        bottom: 30,
        left: 0,
        right: 0,
        paddingVertical: 10,
    },
    endPadding: {
        paddingRight: width - CARD_WIDTH,
    },
    card: {
        padding: 10,
        elevation: 2,
        backgroundColor: "#FFF",
        marginHorizontal: 10,
        shadowColor: "#000",
        shadowRadius: 5,
        shadowOpacity: 0.3,
        shadowOffset: {x: 2, y: -2},
        height: CARD_HEIGHT,
        width: CARD_WIDTH,
        overflow: "hidden",
    },
    cardImage: {
        flex: 3,
        width: "100%",
        height: "100%",
        alignSelf: "center",
    },
    textContent: {
        flex: 1,
    },
    cardtitle: {
        fontSize: 12,
        marginTop: 5,
        fontWeight: "bold",
    },
    cardDescription: {
        fontSize: 12,
        color: "#444",
    },
    markerWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    marker: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#fff",
    },
    ring: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#13B690",
        position: "absolute",
        borderWidth: 1,
        borderColor: "#435464",
    },
});

AppRegistry.registerComponent('bestPlaces', () => bestPlaces);
