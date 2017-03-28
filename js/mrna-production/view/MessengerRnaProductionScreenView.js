// Copyright 2015, University of Colorado Boulder

/**
 * @author Mohamed Safi
 * @author John Blanco
 */

define( function( require ) {
  'use strict';

  // modules
  var CheckBox = require( 'SUN/CheckBox' );
  var DnaMoleculeNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/DnaMoleculeNode' );
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var inherit = require( 'PHET_CORE/inherit' );
  var MessengerRnaNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/MessengerRnaNode' );
  var MessengerRnaProductionModel = require( 'GENE_EXPRESSION_ESSENTIALS/mrna-production/model/MessengerRnaProductionModel' );
  var MobileBiomoleculeNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/MobileBiomoleculeNode' );
  var ModelViewTransform2 = require( 'PHETCOMMON/view/ModelViewTransform2' );
  var Node = require( 'SCENERY/nodes/Node' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var PlacementHintNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/PlacementHintNode' );
  var PlayPauseButton = require( 'SCENERY_PHET/buttons/PlayPauseButton' );
  var PolymeraseAffinityControlPanel = require( 'GENE_EXPRESSION_ESSENTIALS/mrna-production/view/PolymeraseAffinityControlPanel' );
  var Property = require( 'AXON/Property' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var ScreenView = require( 'JOIST/ScreenView' );
  var StepForwardButton = require( 'SCENERY_PHET/buttons/StepForwardButton' );
  var Text = require( 'SCENERY/nodes/Text' );
  var TranscriptionFactorControlPanel = require( 'GENE_EXPRESSION_ESSENTIALS/mrna-production/view/TranscriptionFactorControlPanel' );
  var Vector2 = require( 'DOT/Vector2' );

  // constants
  var INSET = 10;  // Inset for several of the controls.

  // strings
  var negativeTranscriptionFactorString = require( 'string!GENE_EXPRESSION_ESSENTIALS/negativeTranscriptionFactor' );

  /**
   * @param {MessengerRnaProductionModel} model
   * @constructor
   */
  function MessengerRnaProductionScreenView( model ) {

    // due to odd behavior of flickering on this screen, we run it with preventFit
    ScreenView.call( this, { preventFit: true } );
    var self = this;
    this.model = model;
    this.negativeTranscriptionFactorEnabled = new Property( false );
    var viewPortPosition = new Vector2( self.layoutBounds.width * 0.48, self.layoutBounds.height * 0.4 );

    // Set up the model-canvas transform.
    this.mvt = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO, viewPortPosition, 0.2 ); // "Zoom factor" - smaller zooms out, larger zooms in.


    // Set up the root node for all model objects. Nodes placed under this one will scroll when the user moves along the
    // DNA strand.
    this.modelRootNode = new Node();
    this.addChild( this.modelRootNode );


    // Add some layers for enforcing some z-order relationships needed in order to keep things looking good.
    var dnaLayer = new Node();
    this.modelRootNode.addChild( dnaLayer );
    var biomoleculeToolBoxLayer = new Node();
    this.modelRootNode.addChild( biomoleculeToolBoxLayer );
    var messengerRnaLayer = new Node();
    messengerRnaLayer.setPickable( false );
    this.modelRootNode.addChild( messengerRnaLayer );
    var topBiomoleculeLayer = new Node();
    topBiomoleculeLayer.setPickable( false );
    this.modelRootNode.addChild( topBiomoleculeLayer );
    var placementHintLayer = new Node();
    this.modelRootNode.addChild( placementHintLayer );
    var controlsNode = new Node();
    this.addChild( controlsNode );

    // Add the representation of the DNA strand.
    this.dnaMoleculeNode = new DnaMoleculeNode( model.getDnaMolecule(), this.mvt, 5, false );
    dnaLayer.addChild( this.dnaMoleculeNode );

    // Add the placement hints that go on the DNA molecule. These exist on their own layer so that they can be seen
    // above any molecules that are attached to the DNA strand.
    model.getDnaMolecule().getGenes().forEach( function( gene ) {
      gene.getPlacementHints().forEach( function( placementHint ) {
        placementHintLayer.addChild( new PlacementHintNode( self.mvt, placementHint ) );
      } );
    } );


    // Get a reference to the gene being controlled.
    var gene = model.getDnaMolecule().getGenes()[ 0 ];

    // Add the nodes that allow the user to control the concentrations and affinities.
    var positiveTranscriptionFactorControlPanel =
      new TranscriptionFactorControlPanel( model,
        MessengerRnaProductionModel.POSITIVE_TRANSCRIPTION_FACTOR_CONFIG,
        gene.getTranscriptionFactorAffinityProperty( MessengerRnaProductionModel.POSITIVE_TRANSCRIPTION_FACTOR_CONFIG ) );
    controlsNode.addChild( positiveTranscriptionFactorControlPanel );

    var polymeraseAffinityControlPanel = new PolymeraseAffinityControlPanel(
      MessengerRnaProductionModel.POSITIVE_TRANSCRIPTION_FACTOR_CONFIG,
      positiveTranscriptionFactorControlPanel.bounds.height,
      gene.getPolymeraseAffinityProperty() );
    controlsNode.addChild( polymeraseAffinityControlPanel );

    var negativeTranscriptionFactorControlPanel =
      new TranscriptionFactorControlPanel( model,
        MessengerRnaProductionModel.NEGATIVE_TRANSCRIPTION_FACTOR_CONFIG,
        gene.getTranscriptionFactorAffinityProperty( MessengerRnaProductionModel.NEGATIVE_TRANSCRIPTION_FACTOR_CONFIG ) );
    controlsNode.addChild( negativeTranscriptionFactorControlPanel );

    // Add the check box for showing/hiding the control panel for the negative transcription factor.
    var negativeFactorEnabledCheckBox = new CheckBox(
      new Text( negativeTranscriptionFactorString, { font: new PhetFont( 18 ), maxWidth: 275 } ),
      self.negativeTranscriptionFactorEnabled, {
        boxWidth: 20
      } );
    controlsNode.addChild( negativeFactorEnabledCheckBox );


    // Only show the control for the negative transcription factor if it is enabled.
    self.negativeTranscriptionFactorEnabled.link( function( enabled ) {
      negativeTranscriptionFactorControlPanel.setVisible( enabled );
      if ( !enabled ) {
        // When the negative transcription factor control is hidden, there should be no negative factors.
        self.model.negativeTranscriptionFactorCountProperty.reset();
      }
    } );

    // Add play/pause button.
    var playPauseButton = new PlayPauseButton( model.clockRunningProperty, {
      radius: 23,
      touchAreaDilation: 5
    } );
    this.addChild( playPauseButton );

    var stepButton = new StepForwardButton( {
      playingProperty: model.clockRunningProperty,
      listener: function() { model.stepInTime( 0.016 ); },
      radius: 15,
      touchAreaDilation: 5
    } );
    this.addChild( stepButton );

    // Add the Reset All button.
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        self.model.reset();
        self.negativeTranscriptionFactorEnabled.reset();
      },
      right: this.layoutBounds.maxX - INSET,
      bottom: this.layoutBounds.maxY - INSET
    } );
    controlsNode.addChild( resetAllButton );


    // Lay out the controls.

    positiveTranscriptionFactorControlPanel.left = INSET;
    positiveTranscriptionFactorControlPanel.bottom = self.layoutBounds.maxY - INSET;

    polymeraseAffinityControlPanel.left = positiveTranscriptionFactorControlPanel.right + INSET;
    polymeraseAffinityControlPanel.bottom = positiveTranscriptionFactorControlPanel.bottom;

    negativeTranscriptionFactorControlPanel.left = polymeraseAffinityControlPanel.right + INSET;
    negativeTranscriptionFactorControlPanel.bottom = polymeraseAffinityControlPanel.bottom;
    negativeFactorEnabledCheckBox.left = negativeTranscriptionFactorControlPanel.right + INSET;
    negativeFactorEnabledCheckBox.centerY = resetAllButton.centerY;

    playPauseButton.bottom = negativeFactorEnabledCheckBox.top - 2 * INSET;
    playPauseButton.centerX = negativeFactorEnabledCheckBox.centerX;

    stepButton.centerY = playPauseButton.centerY;
    stepButton.left = playPauseButton.right + INSET;

    function addBiomoleculeView( addedBiomolecule ) {
      var biomoleculeNode = new MobileBiomoleculeNode( self.mvt, addedBiomolecule );

      // On this tab, users can't directly interact with individual biomolecules.
      biomoleculeNode.setPickable( false );
      topBiomoleculeLayer.addChild( biomoleculeNode );

      // Add a listener that moves the child on to a lower layer when it connects to the DNA so that we see the desired
      // overlap behavior.
      var positionBiomolecule = function( attachedToDna ) {
        if ( attachedToDna ) {
          if ( topBiomoleculeLayer.hasChild( biomoleculeNode ) ) {
            topBiomoleculeLayer.removeChild( biomoleculeNode );
          }
          dnaLayer.addChild( biomoleculeNode );
        }
        else {
          if ( dnaLayer.hasChild( biomoleculeNode ) ) {
            dnaLayer.removeChild( biomoleculeNode );
          }
          topBiomoleculeLayer.addChild( biomoleculeNode );
        }
      };
      addedBiomolecule.attachedToDnaProperty.lazyLink( positionBiomolecule );

      model.mobileBiomoleculeList.addItemRemovedListener( function removalListener( removedBiomolecule ) {
        if ( removedBiomolecule === addedBiomolecule ) {
          if ( topBiomoleculeLayer.hasChild( biomoleculeNode ) ) {
            topBiomoleculeLayer.removeChild( biomoleculeNode );
          }
          else if ( dnaLayer.hasChild( biomoleculeNode ) ) {
            dnaLayer.removeChild( biomoleculeNode );
          }
          addedBiomolecule.attachedToDnaProperty.unlink( positionBiomolecule );
          biomoleculeNode.dispose();
          model.mobileBiomoleculeList.removeItemRemovedListener( removalListener );
        }
      } );
    }

    model.mobileBiomoleculeList.forEach( function( bioMolecule ) {
      addBiomoleculeView( bioMolecule );
    } );

    // Watch for and handle comings and goings of biomolecules in the model. Most, but not all, of the biomolecules are
    // handled by this. A few others are handled as special cases.
    model.mobileBiomoleculeList.addItemAddedListener( function( addedBiomolecule ) {
      addBiomoleculeView( addedBiomolecule );
    } );


    // Watch for and handle comings and goings of messenger RNA.
    model.messengerRnaList.addItemAddedListener( function( addedMessengerRna ) {

      var messengerRnaNode = new MessengerRnaNode( self.mvt, addedMessengerRna );
      messengerRnaLayer.addChild( messengerRnaNode );

      model.messengerRnaList.addItemRemovedListener( function removalListener( removedMessengerRna ) {
        if ( removedMessengerRna === addedMessengerRna ) {
          messengerRnaLayer.removeChild( messengerRnaNode );
          messengerRnaNode.dispose();
          model.messengerRnaList.removeItemRemovedListener( removalListener );
        }

      } );

    } );


  }

  geneExpressionEssentials.register( 'MessengerRnaProductionScreenView', MessengerRnaProductionScreenView );

  return inherit( ScreenView, MessengerRnaProductionScreenView, {
    step: function() {
      this.dnaMoleculeNode.step();
    }
  } );
} );
