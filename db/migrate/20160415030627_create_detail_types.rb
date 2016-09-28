class CreateDetailTypes < ActiveRecord::Migration
  def change
    create_table :detail_types do |t|
      t.string :name, index: true
      t.timestamps null: false
    end
  end
end
